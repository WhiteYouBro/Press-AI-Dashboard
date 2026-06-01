from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='rawnews',
            name='likes_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='rawnews',
            name='comments_count',
            field=models.IntegerField(default=0),
        ),
    ]
