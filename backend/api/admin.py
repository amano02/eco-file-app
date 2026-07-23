from django.contrib import admin
from .models import Company, EmployeeProfile, NFCCard

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_company', 'created_at')

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'department', 'role')
    list_filter = ('company',) # 会社名で絞り込み
    search_fields = ('name',)

@admin.register(NFCCard)
class NFCCardAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'is_active')
    list_filter = ('is_active',)