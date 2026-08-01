
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from rest_framework import generics, viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import NFCCard, EmployeeProfile
from .serializers import NFCCardReadSerializer, NFCCardWriteSerializer, EmployeeProfileSerializer # 💡EmployeeProfileSerializerを追加
from django.shortcuts import get_object_or_404

# ==========================================
# 1. 一般公開用API（NFCタッチ・名刺交換用）
# ==========================================
class CardDetailAPIView(generics.RetrieveAPIView):
    """
    NFCカードのUUIDを受け取り、関連する社員と会社情報を返すAPI
    ※ 誰でも名刺が見られるように、アクセス制限はかけません。
    """
    serializer_class = NFCCardReadSerializer
    lookup_field = 'id'
    permission_classes = [permissions.AllowAny]  # 誰でもアクセスOK

    def get_queryset(self):
        # 有効なカード（is_active=True）のみを対象とする
        return NFCCard.objects.filter(is_active=True)


# ==========================================
# 2. 管理画面用API（企業担当者のデータ管理用：名刺データ）
# ==========================================
class ManageNFCCardViewSet(viewsets.ModelViewSet):
    """
    企業担当者が自社のカードや社員情報を登録・一覧・編集するためのAPI
    """
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須！

    def get_serializer_class(self):
        # データの作成・更新時（書き込み）はWriteSerializerを、
        # それ以外（一覧取得など）はReadSerializerを使用する
        if self.action in ['create', 'update', 'partial_update']:
            return NFCCardWriteSerializer
        return NFCCardReadSerializer

    def get_queryset(self):
        user = self.request.user

        # スーパーユーザー（管理者）なら全件取得可能
        if user.is_superuser:
            return NFCCard.objects.all()

        # ログインユーザーに会社情報（CompanyUser）が紐付いているかチェック
        if hasattr(user, 'company_profile'):
            user_company = user.company_profile.company
            # 自分の会社の社員のカードのみに絞り込む
            return NFCCard.objects.filter(employee__company=user_company)

        # 会社が紐付いていないユーザーにはデータを返さない
        return NFCCard.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        if hasattr(user, 'company_profile'):
            # 自社のデータとして安全に保存
            serializer.save()
        else:
            raise PermissionDenied("所属会社が設定されていないため、データを作成できません。")


# ==========================================
# 3. 管理画面用API（企業担当者のデータ管理用：社員データ）
# ==========================================
class ManageEmployeeViewSet(viewsets.ModelViewSet):
    """
    企業担当者が自社の社員データを編集するためのAPI
    """
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須
    serializer_class = EmployeeProfileSerializer

    def get_queryset(self):
        user = self.request.user

        # スーパーユーザーなら全件取得可能
        if user.is_superuser:
            return EmployeeProfile.objects.all()

        # ログインユーザーの会社に所属する社員のみに絞り込む
        if hasattr(user, 'company_profile'):
            user_company = user.company_profile.company
            return EmployeeProfile.objects.filter(company=user_company)

        return EmployeeProfile.objects.none()
    
# backend/api/views.py の一番下に追加

# ==========================================
# 4. CSV/Excel 一括インポート用API
# ==========================================
class BulkImportEmployeesView(APIView):
    """
    アップロードされたCSV/Excelファイルを読み込み、社員と名刺データを一括作成するAPI
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # ファイルを受け取るための設定

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "ファイルが選択されていません"}, status=400)

        try:
            # ファイルの拡張子によって読み込み方を変更
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(file_obj)
            else:
                return Response({"error": "CSVまたはExcelファイル(.xlsx)をアップロードしてください"}, status=400)

            # 空のセル（NaN）を空文字に変換
            df = df.fillna('')
            
            user_company = request.user.company_profile.company
            created_count = 0

            # transaction.atomic() で、途中でエラーが起きたら全ての登録を無かったことにする（安全対策）
            with transaction.atomic():
                for index, row in df.iterrows():
                    # 他社アプリでよく使われる列名をチェックしてデータを取得（EightやSansanを想定）
                    name = row.get('氏名', row.get('名前', ''))
                    department = row.get('部署名', row.get('部署', ''))
                    role = row.get('役職', row.get('役名', ''))
                    email = row.get('メールアドレス', row.get('Email', ''))
                    phone = row.get('電話番号', row.get('TEL', ''))

                    # 名前が空の行はスキップ
                    if not name:
                        continue

                    # 1. 社員データの作成
                    employee = EmployeeProfile.objects.create(
                        company=user_company,
                        name=name,
                        department=department,
                        role=role,
                        email=email,
                        phone_number=phone
                    )
                    
                    # 2. 紐づく名刺データ（NFCCard）の作成
                    NFCCard.objects.create(
                        employee=employee,
                        is_active=True # デフォルトで有効にする
                    )
                    created_count += 1

            return Response({"message": f"{created_count}件の名刺データを一括登録しました！"}, status=201)

        except Exception as e:
            return Response({"error": f"ファイルの読み込みに失敗しました: {str(e)}"}, status=500)
