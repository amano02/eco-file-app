from django.db import models
import uuid

class Company(models.Model):
    name = models.CharField('会社名', max_length=100)
    parent_company = models.CharField('親会社', max_length=100, blank=True, null=True)
    business_description = models.TextField('会社がしてること', blank=True)
    website_url = models.URLField('会社URL', blank=True)
    address = models.CharField('所在地', max_length=255, blank=True)
    logo = models.ImageField('企業ロゴ', upload_to='company_logos/', blank=True, null=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)

    def __str__(self):
        return self.name

class EmployeeProfile(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees', verbose_name='所属会社')
    name = models.CharField('名前', max_length=100)
    furigana = models.CharField('ふりがな/ローマ字', max_length=100, blank=True)
    department = models.CharField('部署名', max_length=100, blank=True)
    role = models.CharField('役名', max_length=100)
    career_history = models.TextField('経歴', blank=True)
    email = models.EmailField('メールアドレス', blank=True)
    phone_number = models.CharField('電話番号', max_length=20, blank=True)
    sns_links = models.JSONField('SNSリンク集', default=dict, blank=True) 
    custom_card_image = models.ImageField('カスタム名刺画像', upload_to='custom_cards/', blank=True, null=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.company.name}"

class NFCCard(models.Model):
    id = models.UUIDField('タグID', primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.OneToOneField(EmployeeProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='card', verbose_name='紐づく社員')
    is_active = models.BooleanField('有効ステータス', default=True)

    def __str__(self):
        employee_name = self.employee.name if self.employee else '未割り当て'
        return f"Card [{self.is_active}]: {employee_name}"