from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('articles', '0002_rawnews_engagement_counts'),
    ]

    operations = [
        migrations.CreateModel(
            name='TelegramEditor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.BigIntegerField(unique=True)),
                ('username', models.CharField(blank=True, max_length=150)),
                ('first_name', models.CharField(blank=True, max_length=150)),
                ('last_name', models.CharField(blank=True, max_length=150)),
                ('is_authorized', models.BooleanField(default=False)),
                ('authorized_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('django_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='telegram_editors', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='telegrameditor',
            index=models.Index(fields=['is_authorized', 'chat_id'], name='articles_te_is_auth_4bfd5d_idx'),
        ),
    ]
