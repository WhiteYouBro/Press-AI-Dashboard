from __future__ import annotations

import json
import html
import random
import re
import time
from typing import Iterable

from django.conf import settings
from openai import OpenAI

from .models import Article, PromptHistory, RUBRIC_CHOICES, RawNews


class LLMError(Exception):
    pass


class ParseError(Exception):
    pass


REQUIRED_LLM_FIELDS = {
    'title',
    'title_variants',
    'seo_title',
    'seo_description',
    'lead',
    'body',
    'editor_hints',
    'ai_score',
    'ai_score_reason',
}

SYSTEM_PROMPT = (
    'Ты — опытный редактор и журналист новостного издания. Твоя задача — из исходного текста '
    'расписать подробную, связную и профессиональную статью: выделить главные факты, объяснить '
    'контекст, раскрыть причины и возможные последствия, убрать разговорные обороты и сохранить '
    'нейтральный редакционный стиль. Не выдумывай факты, имена, цифры и цитаты: если данных не хватает, '
    'сформулируй аккуратно и добавь подсказку редактору. Пиши заголовки точно и привлекательно, '
    'без кликбейта. Переписывай материал собственными формулировками и не копируй исходный текст дословно. '
    'Текст статьи делай развёрнутым, структурированным и удобным для публикации. '
    'Никогда не добавляй в статью чужие новости, блоки "Читайте также", комментарии пользователей, '
    'тексты форм входа, рекламные вставки, навигацию сайта и упоминания сторонних СМИ как источника. '
    'Всегда отвечай только валидным JSON-объектом по запрошенной схеме — без markdown, без комментариев, '
    'без текста вне JSON.'
)


RUBRIC_NAMES = tuple(choice[0] for choice in RUBRIC_CHOICES)

SOURCE_NOISE_PHRASES = (
    'авторов комментариев',
    'на указанный вами телефон',
    'будет отправлен код доступа',
    'введите его',
    'tengri id',
    'единый вход для сервисов',
    'нажимая кнопку входа',
    'пользовательского соглашения',
    'политику конфиденциальности',
    'пароль должен быть',
    'введите код активации',
    'неприемлемый контент',
    'показать комментарии',
    'комментарии к материалу',
    'оставить комментарий',
    'войдите',
    'зарегистрируйтесь',
    'читайте также',
    'похожие новости',
    'другие новости',
    'самое читаемое',
    'самое обсуждаемое',
    'обсуждаемое сейчас',
    'материал подготовлен в автоматическом режиме',
)

SOURCE_STOP_PHRASES = (
    'авторов комментариев',
    'комментарии к материалу',
    'показать комментарии',
    'на указанный вами телефон',
    'tengri id',
    'читайте также',
    'похожие новости',
    'другие новости',
    'самое читаемое',
    'самое обсуждаемое',
    'обсуждаемое сейчас',
)

RUBRIC_KEYWORDS = {
    'Политика': ('президент', 'токаев', 'путин', 'зеленск', 'правительство', 'парламент', 'сенат', 'мажилис', 'депутат', 'министр', 'аким', 'акимат', 'выборы', 'законопроект', 'госвизит', 'дипломат', 'посол', 'санкции', 'конституция', 'партия'),
    'Экономика': ('экономика', 'бизнес', 'банк', 'курс', 'тенге', 'доллар', 'нефть', 'газ', 'налог', 'бюджет', 'рынок', 'инфляция', 'кредит', 'ипотека', 'зарплата', 'пенсия', 'тариф', 'цены', 'инвестиции', 'экспорт', 'импорт', 'акции', 'биржа', 'нацбанк'),
    'Происшествия': ('дтп', 'авария', 'пожар', 'взрыв', 'обрушение', 'погибли', 'пострадали', 'спасатели', 'чп', 'трагедия', 'напал', 'ударил', 'избил', 'эвакуация', 'задержали после', 'пропал', 'нашли тело', 'скорая', 'мчс'),
    'Криминал': ('убийство', 'кража', 'мошенничество', 'наркотики', 'похищение', 'ограбление', 'преступление', 'подозреваемый', 'уголовное дело', 'арестован', 'задержан', 'колония', 'насилие'),
    'Право': ('суд', 'прокуратура', 'адвокат', 'иск', 'приговор', 'штраф', 'закон', 'кодекс', 'верховный суд', 'конституционный суд', 'минюст', 'права', 'юрист', 'расследование', 'проверка', 'обвинение'),
    'Общество': ('общество', 'жители', 'город', 'семья', 'дети', 'соцсети', 'волонтёры', 'волонтеры', 'помощь', 'праздник', 'очередь', 'услуги', 'население', 'пенсионеры', 'коммунальные'),
    'Мир': ('сша', 'европа', 'китай', 'россия', 'украина', 'израиль', 'германия', 'франция', 'оон', 'нато', 'ес', 'зарубеж', 'иностран', 'международ', 'граница', 'война', 'переговоры'),
    'Наука': ('учёные', 'ученые', 'исследование', 'открытие', 'космос', 'лаборатория', 'эксперимент', 'археологи', 'астрономы', 'физики', 'биологи', 'научный', 'днк'),
    'Здоровье': ('больница', 'врач', 'врачи', 'медицина', 'здоровье', 'вирус', 'вакцина', 'эпидемия', 'пациент', 'лечение', 'минздрав', 'операция', 'клиника', 'лекарство', 'инфекция'),
    'Образование': ('школа', 'учитель', 'ученики', 'университет', 'студенты', 'образование', 'экзамен', 'ент', 'диплом', 'колледж', 'детский сад', 'урок', 'учебный год'),
    'Культура': ('кино', 'театр', 'музыка', 'концерт', 'артист', 'фильм', 'книга', 'искусство', 'выставка', 'фестиваль', 'музей', 'режиссёр', 'режиссер', 'актер', 'певец', 'культура'),
    'Спорт': ('спорт', 'футбол', 'хоккей', 'бокс', 'теннис', 'олимпиада', 'матч', 'чемпионат', 'турнир', 'спортсмен', 'гол', 'сборная', 'медаль'),
    'Технологии': ('технологии', 'интернет', 'it', 'искусственный интеллект', 'ии', 'гаджет', 'смартфон', 'цифровой', 'кибер', 'стартап', 'приложение', 'робот', 'нейросеть'),
    'Транспорт': ('дорога', 'дороги', 'транспорт', 'автобус', 'метро', 'поезд', 'аэропорт', 'самолёт', 'самолет', 'рейс', 'такси', 'пробка', 'улица', 'перекрытие', 'мост', 'трасса'),
    'Экология': ('экология', 'климат', 'загрязнение', 'выбросы', 'отходы', 'мусор', 'река', 'лес', 'животные', 'заповедник', 'смог', 'ураган', 'наводнение', 'землетрясение'),
    'Недвижимость': ('недвижимость', 'жильё', 'жилье', 'квартира', 'дом', 'ипотека', 'застройщик', 'новостройка', 'аренда', 'строительство', 'долевое', 'жилой комплекс'),
}


def _normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return min(max(value / max_value, 0.0), 1.0)


def rank_news(news_list: Iterable[RawNews]) -> list[tuple[RawNews, float]]:
    news = list(news_list)
    if not news:
        return []

    max_views = max(item.views_count for item in news) or 1
    max_shares = max(item.shares_count for item in news) or 1
    weights = settings.AI_RANKING_WEIGHTS

    ranked = []
    for item in news:
        score = (
            item.ctr * weights['ctr']
            + _normalize(item.views_count, max_views) * weights['views']
            + _normalize(item.shares_count, max_shares) * weights['shares']
            + min(max(item.trending_score, 0.0), 1.0) * weights['trending']
        )
        ranked.append((item, round(score, 6)))
    return sorted(ranked, key=lambda row: row[1], reverse=True)


def _strip_source_attribution(value: str) -> str:
    text = re.sub(
        r'\s*,?\s*(?:переда[её]т|сообща[её]т)\s+(?:корреспондент\s+)?[a-zа-яё0-9.-]+\.[a-zа-яё]{2,}\.?\s*$',
        '',
        value,
        flags=re.IGNORECASE,
    )
    return text.strip()


def clean_source_material(value: str) -> str:
    raw = html.unescape(str(value or ''))
    raw = re.sub(r'<br\s*/?>', '\n', raw, flags=re.IGNORECASE)
    raw = re.sub(r'</(p|div|li|blockquote|h[1-6])\s*>', '\n', raw, flags=re.IGNORECASE)
    raw = re.sub(r'<[^>]+>', ' ', raw)
    raw = raw.replace('\r\n', '\n').replace('\r', '\n')

    lines = []
    for line in raw.split('\n'):
        text = re.sub(r'\s+', ' ', line).strip()
        if not text:
            continue
        lower = text.lower()
        if any(phrase in lower for phrase in SOURCE_STOP_PHRASES):
            break
        if any(phrase in lower for phrase in SOURCE_NOISE_PHRASES):
            continue
        text = _strip_source_attribution(text)
        if text:
            lines.append(text)

    return '\n\n'.join(dict.fromkeys(lines))


def _contains_noise(value: str) -> bool:
    lower = html.unescape(re.sub(r'<[^>]+>', ' ', str(value or ''))).lower()
    return any(phrase in lower for phrase in SOURCE_NOISE_PHRASES)


def _strip_competitor_mentions(value: str) -> str:
    text = re.sub(r'\s*,?\s*(?:переда[её]т|сообща[её]т)\s+(?:корреспондент\s+)?(?:tengrinews\.kz|[a-zа-яё0-9.-]+\.[a-zа-яё]{2,})\.?', '', str(value or ''), flags=re.IGNORECASE)
    text = re.sub(r'\bTengrinews\.kz\b', '', text, flags=re.IGNORECASE)
    return re.sub(r'\s{2,}', ' ', text).strip()


def _sanitize_generated_body(value: str) -> str:
    body = _strip_competitor_mentions(value)
    paragraphs = re.findall(r'<p\b[^>]*>.*?</p>', body, flags=re.IGNORECASE | re.DOTALL)
    if not paragraphs:
        cleaned = clean_source_material(body)
        return ''.join(f'<p>{line}</p>' for line in cleaned.split('\n\n') if line)
    return ''.join(part for part in paragraphs if not _contains_noise(part))


def sanitize_article_data(data: dict) -> dict:
    for field in ('title', 'seo_title', 'seo_description', 'lead', 'ai_score_reason'):
        if field in data:
            data[field] = _strip_competitor_mentions(data.get(field, ''))
    data['body'] = _sanitize_generated_body(data.get('body', ''))
    return data


def _generate_mock_article_data(raw_news: RawNews) -> dict:
    """Generate realistic article data without calling external LLM."""
    rubric = raw_news.rubric
    title = raw_news.title
    body = clean_source_material(raw_news.body) or raw_news.body

    seo_title = f"{title[:55]} — аналитика" if len(title) > 55 else f"{title} — обзор"
    seo_desc = f"Подробный разбор события в рубрике «{rubric}». Ключевые факты, экспертные оценки и последствия."

    lead_text = (
        f"В рубрике «{rubric}» произошло важное событие, привлекшее внимание экспертов и общественности. "
        f"{body[:120]}... Детали и анализ — в нашем материале."
    )

    article_body = f"""<p><strong>{lead_text}</strong></p>
<p>{body}</p>
<p>Эксперты отмечают, что данное событие может оказать значительное влияние на дальнейшее развитие ситуации в сфере {rubric.lower()}. Аналитики прогнозируют как краткосрочные, так и долгосрочные последствия.</p>
<p>Официальные представители заявили, что все необходимые меры уже принимаются. Дополнительная информация будет опубликована по мере поступления.</p>"""

    score = calculate_ai_score(raw_news)
    score_reason = (
        f"CTR {raw_news.ctr:.2%}, просмотры {raw_news.views_count:,}, тренд {raw_news.trending_score:.2f}. "
        "Автоматически сгенерировано без LLM API."
    )

    return {
        'title': f"{rubric}: {title[:60]}" if len(title) > 60 else title,
        'title_variants': [
            f"Главное в {rubric.lower()}: ключевые детали",
            f"{rubric}: что изменится",
            f"Анализ: {title[:45]}" if len(title) > 45 else f"Анализ: {title}",
        ],
        'seo_title': seo_title[:60],
        'seo_description': seo_desc[:155],
        'lead': lead_text,
        'body': article_body,
        'tags': [rubric.lower(), 'новости', 'аналитика', 'авто'],
        'editor_hints': [
            {'position': 1, 'type': 'photo', 'icon': 'image', 'text': 'Вставьте фотографию 1200×630px с места события.'},
            {'position': 2, 'type': 'quote', 'icon': 'quote', 'text': 'Добавьте официальный комментарий представителя.'},
            {'position': 3, 'type': 'data', 'icon': 'chart', 'text': 'Укажите актуальную статистику по теме.'},
        ],
        'ai_score': score,
        'ai_score_reason': score_reason,
    }


def _call_llm_with_meta(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> tuple[str, int, int]:
    groq_key = settings.GROQ_API_KEY
    openai_key = settings.OPENAI_API_KEY

    if groq_key and groq_key.startswith('gsk_'):
        client = OpenAI(api_key=groq_key, base_url='https://api.groq.com/openai/v1')
        model = settings.GROQ_MODEL
    elif openai_key and not openai_key.startswith('sk-change-me'):
        client = OpenAI(api_key=openai_key)
        model = settings.OPENAI_MODEL
    else:
        raise LLMError('No LLM API key configured (GROQ_API_KEY or OPENAI_API_KEY)')

    last_error = None
    started = time.perf_counter()

    for _ in range(3):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt},
                ],
                temperature=temperature,
                response_format={'type': 'json_object'},
            )
            duration_ms = int((time.perf_counter() - started) * 1000)
            content = response.choices[0].message.content or ''
            tokens_used = response.usage.total_tokens if response.usage else 0
            return content, tokens_used, duration_ms
        except Exception as exc:
            last_error = exc
            time.sleep(1)

    raise LLMError(str(last_error))


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    response_text, _, _ = _call_llm_with_meta(system_prompt, user_prompt, temperature)
    return response_text


def parse_llm_json(response_text: str) -> dict:
    cleaned = response_text.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        match = re.search(r'\{.*\}', cleaned, flags=re.DOTALL)
        if not match:
            raise ParseError(f'Invalid JSON response: {exc}') from exc
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError as nested_exc:
            raise ParseError(f'Invalid JSON response: {nested_exc}') from nested_exc

    missing = REQUIRED_LLM_FIELDS - set(data.keys())
    if missing:
        raise ParseError(f'Missing required fields: {", ".join(sorted(missing))}')

    if not isinstance(data.get('title_variants'), list):
        raise ParseError('title_variants must be a list')
    if not isinstance(data.get('editor_hints'), list):
        raise ParseError('editor_hints must be a list')

    return data


def classify_rubric(title: str, body: str, source_name: str = '', source_url: str = '', preferred_rubric: str = '') -> dict:
    fallback = classify_rubric_by_keywords(title, body, source_name, source_url, preferred_rubric)
    system_prompt = (
        'Ты — выпускающий редактор новостного издания. Определи одну главную рубрику материала. '
        'Выбирай только из разрешённого списка. Если в новости есть конфликт тем, выбирай по главному событию, '
        'а не по месту действия. Не используй "Общество", если есть более точная рубрика.'
    )
    user_prompt = f'''Разрешённые рубрики:
{", ".join(RUBRIC_NAMES)}

Подсказка от источника: {preferred_rubric or "нет"}
Источник: {source_name}
URL: {source_url}
Заголовок: {title}
Текст: {body[:2500]}

Ответь JSON строго по схеме:
{{
  "rubric": "одна рубрика из списка",
  "confidence": 0.0,
  "reason": "короткое объяснение"
}}'''

    try:
        response_text = call_llm(system_prompt, user_prompt, temperature=0.1)
        data = json.loads(response_text.strip())
        rubric = str(data.get('rubric') or '').strip()
        if rubric not in RUBRIC_NAMES:
            raise ParseError('Invalid rubric')
        confidence = float(data.get('confidence') or 0)
        return {
            'rubric': rubric,
            'confidence': min(max(confidence, 0.0), 1.0),
            'reason': str(data.get('reason') or '').strip(),
            'method': 'ai',
        }
    except Exception:
        return fallback


def classify_rubric_by_keywords(title: str, body: str, source_name: str = '', source_url: str = '', preferred_rubric: str = '') -> dict:
    haystack = ' '.join([title or '', body or '', source_name or '', source_url or '']).lower()
    scores = {rubric: 0 for rubric in RUBRIC_NAMES}

    for rubric, keywords in RUBRIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword_matches(haystack, keyword):
                scores[rubric] += 3 if keyword in (title or '').lower() else 1

    url = (source_url or '').lower()
    if any(part in url for part in ['/politic', '/politics', 'government']):
        scores['Политика'] += 4
    if any(part in url for part in ['/business', '/econom', '/money', '/markets']):
        scores['Экономика'] += 4
    if any(part in url for part in ['/sport']):
        scores['Спорт'] += 4
    if any(part in url for part in ['/incident', '/crime']):
        scores['Происшествия'] += 4
    if any(part in url for part in ['/world', '/sng']):
        scores['Мир'] += 4

    if preferred_rubric in scores and preferred_rubric != 'Общество':
        scores[preferred_rubric] += 1

    rubric, score = max(scores.items(), key=lambda item: item[1])
    if score <= 0:
        rubric = preferred_rubric if preferred_rubric in RUBRIC_NAMES else 'Общество'
    confidence = min(max(score / 8, 0.25), 0.9) if score > 0 else 0.25
    return {
        'rubric': rubric,
        'confidence': round(confidence, 2),
        'reason': 'Определено по ключевым словам и URL источника.',
        'method': 'keywords',
    }


def keyword_matches(haystack: str, keyword: str) -> bool:
    if len(keyword) <= 3 or keyword in {'мир', 'сша', 'оон', 'нато', 'ес', 'it', 'ии'}:
        return bool(re.search(rf'(?<![\wа-яё]){re.escape(keyword)}(?![\wа-яё])', haystack, flags=re.IGNORECASE))
    return keyword in haystack


def calculate_ai_score(raw_news: RawNews) -> float:
    ctr_score = min(max(raw_news.ctr / 0.08, 0.0), 1.0) * 5
    views_score = min(max(raw_news.views_count / 500000, 0.0), 1.0) * 3
    trending_score = min(max(raw_news.trending_score, 0.0), 1.0) * 2
    return round(ctr_score + views_score + trending_score, 1)


def _rewrite_prompt(raw_news: RawNews) -> str:
    source_body = clean_source_material(raw_news.body) or raw_news.body
    return f'''На основе исходного текста подготовь подробную новостную статью в профессиональном стиле издания.

Рубрика: {raw_news.rubric}
Заголовок источника: {raw_news.title}
Исходный текст: {source_body}

Жёсткие правила:
1. Используй только факты из исходного текста о главном событии.
2. Не вставляй другие новостные статьи, блоки "Читайте также", "Похожие новости", "Самое читаемое", "Самое обсуждаемое".
3. Не вставляй комментарии пользователей, тексты авторизации, Tengri ID, инструкции входа, сообщения о коде доступа, политику конфиденциальности.
4. Не упоминай сторонние СМИ и сайты как источник, включая Tengrinews.kz и похожие названия. Убери формулировки вроде "передает корреспондент..." и "сообщает ...".
5. Если в исходнике есть мусор от сайта или конкурентов, полностью игнорируй его.
6. Не добавляй финальные фразы вроде "следите за обновлениями", если их нет в исходном событии.

Ответь JSON строго по схеме:
{{
  "title": "Заголовок (до 80 символов, без кликбейта)",
  "title_variants": ["Вариант 2", "Вариант 3", "Вариант 4"],
  "seo_title": "SEO-заголовок (до 60 символов)",
  "seo_description": "Meta-описание (до 155 символов)",
  "lead": "Лид — первый абзац (2-3 предложения, суть новости)",
  "body": "Подробный полный текст статьи (6-10 абзацев, HTML-разметка p/strong/em)",
  "tags": ["тег1", "тег2", "тег3"],
  "ai_score": 8.5,
  "ai_score_reason": "Высокий CTR оригинала, тема в тренде, чёткая фактология",
  "editor_hints": [
    {{"position": 1, "type": "photo", "icon": "image", "text": "Вставьте фотографию с места события. Рекомендуемый размер: 1200×630px"}},
    {{"position": 2, "type": "quote", "icon": "quote", "text": "Добавьте официальный комментарий от пресс-службы"}},
    {{"position": 3, "type": "data", "icon": "chart", "text": "Здесь уместна статистика или инфографика"}}
  ]
}}'''


def rewrite_news(raw_news: RawNews) -> Article:
    user_prompt = _rewrite_prompt(raw_news)
    try:
        response_text, tokens_used, duration_ms = _call_llm_with_meta(SYSTEM_PROMPT, user_prompt)
        data = parse_llm_json(response_text)
    except (LLMError, ParseError):
        data = _generate_mock_article_data(raw_news)
        response_text = json.dumps(data, ensure_ascii=False)
        tokens_used = 0
        duration_ms = 0

    data = sanitize_article_data(data)
    article = Article.objects.create(
        raw_news=raw_news,
        source_type='ai_pipeline',
        title=data['title'],
        seo_title=data.get('seo_title', '')[:70],
        seo_description=data.get('seo_description', '')[:160],
        lead=data['lead'],
        body=data['body'],
        rubric=raw_news.rubric,
        tags=data.get('tags', []),
        editor_hints=data.get('editor_hints', []),
        title_variants=data.get('title_variants', []),
        ai_score=float(data.get('ai_score') or calculate_ai_score(raw_news)),
        ai_score_reason=data.get('ai_score_reason', ''),
        status='pending',
    )
    PromptHistory.objects.create(
        article=article,
        prompt_type='rewrite',
        prompt_text=user_prompt,
        response_text=response_text,
        tokens_used=tokens_used,
        duration_ms=duration_ms,
    )
    return article


def _manual_prompt(raw_text: str, rubric: str) -> str:
    source_text = clean_source_material(raw_text) or raw_text
    return f'''Журналист предоставил сырой материал. Проанализируй его и создай полноценную новостную статью.

Рубрика: {rubric}
Исходный материал: {source_text}

Жёсткие правила:
1. Используй только факты из исходного материала о главном событии.
2. Не вставляй другие новостные статьи, блоки "Читайте также", "Похожие новости", "Самое читаемое", "Самое обсуждаемое".
3. Не вставляй комментарии пользователей, тексты авторизации, Tengri ID, инструкции входа, сообщения о коде доступа, политику конфиденциальности.
4. Не упоминай сторонние СМИ и сайты как источник, включая Tengrinews.kz и похожие названия. Убери формулировки вроде "передает корреспондент..." и "сообщает ...".
5. Если в исходнике есть мусор от сайта или конкурентов, полностью игнорируй его.
6. Не добавляй финальные фразы вроде "следите за обновлениями", если их нет в исходном событии.

Дополнительно в JSON добавь:
"source_analysis": {{
  "readability_score": 7.2,
  "facts_completeness": "средняя",
  "neutrality": "высокая",
  "improvements": ["Добавлен профессиональный лид", "Структурирован текст", "Убраны разговорные обороты"]
}}

Формат ответа — тот же JSON что для rewrite.'''


def process_manual(raw_text: str, rubric: str) -> dict:
    user_prompt = _manual_prompt(raw_text, rubric)
    try:
        response_text, tokens_used, duration_ms = _call_llm_with_meta(SYSTEM_PROMPT, user_prompt)
        data = parse_llm_json(response_text)
    except (LLMError, ParseError):
        score = round(random.uniform(6.5, 9.2), 1)
        cleaned_text = clean_source_material(raw_text) or raw_text
        data = {
            'title': f'{rubric}: важное событие',
            'title_variants': ['Ключевые детали', 'Что известно', 'Анализ ситуации'],
            'seo_title': f'{rubric}: обзор события'[:60],
            'seo_description': f'Подробный разбор в рубрике «{rubric}».'[:155],
            'lead': f'В рубрике «{rubric}» произошло значимое событие. {cleaned_text[:100]}...',
            'body': f'<p>{cleaned_text}</p>',
            'tags': [rubric.lower(), 'ручной ввод'],
            'editor_hints': [
                {'position': 1, 'type': 'photo', 'icon': 'image', 'text': 'Добавьте иллюстрацию.'},
            ],
            'ai_score': score,
            'ai_score_reason': 'Автоматическая оценка без LLM API.',
        }
        response_text = json.dumps(data, ensure_ascii=False)
        tokens_used = 0
        duration_ms = 0

    data = sanitize_article_data(data)
    data['_prompt_history'] = {
        'prompt_type': 'manual',
        'prompt_text': user_prompt,
        'response_text': response_text,
        'tokens_used': tokens_used,
        'duration_ms': duration_ms,
    }
    return data


def generate_telegram_post(raw_text: str) -> dict:
    system_prompt = (
        'Ты — редактор новостного Telegram-канала. Из сырого текста сделай короткий, ясный пост '
        'в стиле новостного Telegram-канала. Не добавляй непроверенные факты. Верни только JSON.'
    )
    user_prompt = f'''Сырой текст:
{raw_text}

Ответь JSON строго по схеме:
{{
  "emoji": "одно подходящее эмодзи",
  "text": "готовый Telegram-пост: 1 короткий заголовок и 1-3 абзаца"
}}'''

    try:
        response_text = call_llm(system_prompt, user_prompt, temperature=0.5)
        data = json.loads(response_text.strip())
        emoji = str(data.get('emoji') or '📰').strip()[:4]
        text = str(data.get('text') or '').strip()
        if not text:
            raise ParseError('Empty Telegram post text')
        return {'emoji': emoji, 'text': text}
    except Exception:
        cleaned = re.sub(r'\s+', ' ', raw_text).strip()
        first_sentence = re.split(r'(?<=[.!?])\s+', cleaned)[0] if cleaned else ''
        title = first_sentence[:90].rstrip(',. ')
        body = cleaned[:700].rstrip()
        return {
            'emoji': pick_telegram_post_emoji(cleaned),
            'text': f'{title}\n\n{body}' if title and body != title else body,
        }


def pick_telegram_post_emoji(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ['путин', 'президент', 'министр', 'парламент', 'аким', 'правительство']):
        return '🏛'
    if any(word in lowered for word in ['дорог', 'транспорт', 'аэропорт', 'авиац', 'авто', 'поезд']):
        return '🚦'
    if any(word in lowered for word in ['пожар', 'дтп', 'авар', 'срочно', 'экстренн']):
        return '🚨'
    if any(word in lowered for word in ['тенге', 'доллар', 'банк', 'цена', 'эконом', 'бизнес']):
        return '💰'
    if any(word in lowered for word in ['спорт', 'матч', 'футбол', 'бокс', 'турнир']):
        return '🏆'
    return '📰'
