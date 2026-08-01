from rest_framework import serializers
from .models import Company, EmployeeProfile, NFCCard, CompanyUser
 
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__' # すべてのフィールドを出力

class EmployeeProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True) # 会社情報も一緒に取得
    
    class Meta:
        model = EmployeeProfile
        fields = '__all__'

class NFCCardReadSerializer(serializers.ModelSerializer):
    """
    読み込み専用のシリアライザ。
    ネストされた情報をリッチに表示する。
    """
    employee = EmployeeProfileSerializer(read_only=True) # 社員情報も一緒に取得
    
    class Meta:
        model = NFCCard
        fields = '__all__'

class NFCCardWriteSerializer(serializers.ModelSerializer):
    """
    書き込み・更新用のシリアライザ。
    関連フィールドはIDで指定する。
    """
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeProfile.objects.all(), required=False, allow_null=True)

    class Meta:
        model = NFCCard
        fields = ('employee', 'is_active')