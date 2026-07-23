from rest_framework import serializers
from .models import Company, EmployeeProfile, NFCCard

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__' # すべてのフィールドを出力

class EmployeeProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True) # 会社情報も一緒に取得
    
    class Meta:
        model = EmployeeProfile
        fields = '__all__'

class NFCCardSerializer(serializers.ModelSerializer):
    employee = EmployeeProfileSerializer(read_only=True) # 社員情報も一緒に取得
    
    class Meta:
        model = NFCCard
        fields = '__all__'