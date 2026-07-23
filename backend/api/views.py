from rest_framework import generics
from .models import NFCCard
from .serializers import NFCCardSerializer
from django.shortcuts import get_object_or_404

class CardDetailAPIView(generics.RetrieveAPIView):
    """
    NFCカードのUUIDを受け取り、関連する社員と会社情報を返すAPI
    """
    serializer_class = NFCCardSerializer
    lookup_field = 'id'

    def get_queryset(self):
        # 有効なカード（is_active=True）のみを対象とする
        return NFCCard.objects.filter(is_active=True)