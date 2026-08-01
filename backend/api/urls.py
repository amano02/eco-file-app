from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CardDetailAPIView, ManageNFCCardViewSet, ManageEmployeeViewSet, BulkImportEmployeesView
# 💡 修正箇所1：ManageEmployeeViewSet をインポートに追加しました
from .views import CardDetailAPIView, ManageNFCCardViewSet, ManageEmployeeViewSet

# DRFのルーターを準備
router = DefaultRouter()

# 管理用APIのエンドポイントを登録
router.register(r'manage/cards', ManageNFCCardViewSet, basename='manage-cards')
# 💡 修正箇所2：社員データ管理用のエンドポイントを追加しました
router.register(r'manage/employees', ManageEmployeeViewSet, basename='manage-employees')

urlpatterns = [
    # ログイン（JWTトークン発行・更新）用のURL
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 1. 一般公開用（名刺閲覧用）のURL
    path('cards/<str:id>/', CardDetailAPIView.as_view(), name='card-detail'),

    path('manage/import/', BulkImportEmployeesView.as_view(), name='bulk-import'),

    # 2. 管理用APIのURL：ルーターが自動生成したURLを読み込む
    path('', include(router.urls)),
    
    
]