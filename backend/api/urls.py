from django.urls import path
from .views import CardDetailAPIView

urlpatterns = [
    path('cards/<uuid:id>/', CardDetailAPIView.as_view(), name='card-detail'),
]
