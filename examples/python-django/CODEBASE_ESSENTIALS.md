# Codebase Essentials - Django Blog API

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Backend:**
- Python 3.11
- Django 4.2
- Django REST Framework 3.14
- PostgreSQL 15

**Testing:**
- pytest 7.4
- pytest-django 4.5
- factory-boy 3.3 (test data generation)

**Infrastructure:**
- Docker & Docker Compose
- nginx (production)
- Gunicorn (WSGI server)

**Key Dependencies:**
- python-dotenv (environment variables)
- psycopg2-binary (PostgreSQL adapter)
- django-cors-headers (CORS handling)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **Backend Python** | `docker-compose exec backend pytest -x` | All tests pass, no failures |
| **Backend Specific** | `docker-compose exec backend pytest path/to/test_file.py -x` | Specific tests pass |
| **Database Migrations** | `docker-compose exec backend python manage.py migrate` | No migration errors |
| **Code Quality** | `docker-compose exec backend flake8 .` | No linting errors |

**Stop on first failure (`-x` flag) to prevent cascading errors.**

---

## Core Patterns

### 1. API Endpoints (Django REST Framework)

**Pattern: ViewSet + Serializer + Router**

```python
# blog/serializers.py
from rest_framework import serializers
from .models import Article

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'author_name', 
                  'created_at', 'updated_at', 'published']
        read_only_fields = ['author', 'created_at', 'updated_at']

# blog/views.py
from rest_framework import viewsets, permissions
from .models import Article
from .serializers import ArticleSerializer

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related('author')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# blog/urls.py
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)

urlpatterns = router.urls
```

**Why:**
- ViewSets reduce boilerplate for CRUD operations
- Serializers handle validation + representation
- Routers auto-generate URL patterns
- `select_related` prevents N+1 queries

### 2. Model Design

**Pattern: Timestamps + Author Tracking**

```python
# blog/models.py
from django.db import models
from django.contrib.auth.models import User

class TimestampedModel(models.Model):
    """Abstract base class with timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Article(TimestampedModel):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    published = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
```

**Why:**
- Abstract base class enforces timestamp consistency
- `related_name` makes reverse queries readable
- `ordering` provides default sort behavior
- `__str__` improves admin interface and debugging

### 3. Testing with Factories

**Pattern: factory-boy for Test Data**

```python
# blog/factories.py
import factory
from django.contrib.auth.models import User
from .models import Article

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')

class ArticleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Article
    
    title = factory.Faker('sentence', nb_words=5)
    content = factory.Faker('paragraph', nb_sentences=10)
    author = factory.SubFactory(UserFactory)
    published = True

# blog/tests/test_articles.py
import pytest
from rest_framework.test import APIClient
from blog.factories import ArticleFactory, UserFactory

@pytest.mark.django_db
class TestArticleAPI:
    def test_list_articles(self):
        # Arrange
        ArticleFactory.create_batch(3, published=True)
        client = APIClient()
        
        # Act
        response = client.get('/api/articles/')
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 3
    
    def test_create_article_requires_auth(self):
        # Arrange
        client = APIClient()
        data = {'title': 'Test', 'content': 'Content'}
        
        # Act
        response = client.post('/api/articles/', data)
        
        # Assert
        assert response.status_code == 401
    
    def test_create_article_authenticated(self):
        # Arrange
        user = UserFactory()
        client = APIClient()
        client.force_authenticate(user=user)
        data = {'title': 'Test', 'content': 'Content', 'published': True}
        
        # Act
        response = client.post('/api/articles/', data)
        
        # Assert
        assert response.status_code == 201
        assert response.json()['author_name'] == user.username
```

**Why:**
- Factories eliminate test data boilerplate
- `Faker` provides realistic test data
- Arrange-Act-Assert structure makes tests readable
- `@pytest.mark.django_db` handles database transactions

### 4. Environment Configuration

**Pattern: django-environ + .env**

```python
# settings.py
import environ

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)

# Read .env file
environ.Env.read_env()

DEBUG = env('DEBUG')
SECRET_KEY = env('SECRET_KEY')

DATABASES = {
    'default': env.db()  # Reads DATABASE_URL
}

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
```

```bash
# .env.example
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Why:**
- Environment variables for deployment flexibility
- `.env.example` documents required settings
- Type casting (bool, list, db) reduces errors
- Defaults for non-critical settings

---

## Critical Invariants

### NEVER Violate These Rules

1. **Always use transactions for multi-model operations**
   ```python
   from django.db import transaction
   
   @transaction.atomic
   def create_article_with_tags(title, content, tag_names):
       article = Article.objects.create(title=title, content=content)
       for name in tag_names:
           tag, _ = Tag.objects.get_or_create(name=name)
           article.tags.add(tag)
       return article
   ```

2. **Never expose DEBUG=True in production**
   - Check `settings.py` ensures `DEBUG=False` in production
   - Use environment variables, never hardcode

3. **Always validate permissions in ViewSets**
   - Default: `permission_classes = [permissions.IsAuthenticated]`
   - Public endpoints: explicitly set `AllowAny`
   - Custom permissions for complex logic

4. **Never commit secrets to version control**
   - Use `.env` for secrets
   - `.gitignore` must include `.env`
   - Use `.env.example` for documentation

5. **Always use `select_related` / `prefetch_related` for relations**
   - Prevents N+1 query problems
   - Check Django Debug Toolbar for query counts

---

## Common Gotchas

### 1. Migration Conflicts

**Problem:** Multiple developers create migrations simultaneously.

**Solution:**
```bash
# Always pull latest migrations before creating new ones
git pull
python manage.py makemigrations
python manage.py migrate

# If conflict occurs:
python manage.py makemigrations --merge
```

### 2. Test Database Isolation

**Problem:** Tests fail when run together but pass individually.

**Solution:**
```python
# Use pytest fixtures with autouse for cleanup
@pytest.fixture(autouse=True)
def reset_sequences(db):
    """Reset database sequences after each test"""
    from django.core.management import call_command
    yield
    call_command('flush', '--no-input')

# Or use pytest-django's transactional tests
@pytest.mark.django_db(transaction=True)
def test_with_transaction():
    pass
```

### 3. CORS in Development

**Problem:** Frontend on `localhost:5173` can't access API on `localhost:8000`.

**Solution:**
```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

# Development only
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
```

### 4. Static Files in Production

**Problem:** Static files (CSS, JS) not served in production.

**Solution:**
```python
# settings.py
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Before deployment:
python manage.py collectstatic --no-input

# nginx.conf
location /static/ {
    alias /app/staticfiles/;
}
```

---

## Architecture Decisions

### Why Django REST Framework?

**Decision:** Use DRF for API instead of plain Django views.

**Rationale:**
- Serialization + validation in one place
- Built-in pagination, filtering, authentication
- OpenAPI schema generation (drf-spectacular)
- Industry standard for Django APIs

**Alternatives considered:**
- Plain Django views: Too much boilerplate
- FastAPI: Would require leaving Django ecosystem

### Why PostgreSQL?

**Decision:** Use PostgreSQL as primary database.

**Rationale:**
- JSON fields for flexible data
- Full-text search capabilities
- Battle-tested in production
- Django has excellent PostgreSQL support

**Alternatives considered:**
- SQLite: Not suitable for production
- MySQL: PostgreSQL has better Django integration

### Why pytest over unittest?

**Decision:** Use pytest for all tests.

**Rationale:**
- More readable assertions (`assert x == y` vs `self.assertEqual`)
- Powerful fixtures for test setup
- Better parameterization support
- Active ecosystem (pytest-django, pytest-cov)

**Alternatives considered:**
- Django's unittest: More verbose, less flexible

---

## File Organization

```
backend/
├── manage.py
├── pyproject.toml              # Dependencies
├── pytest.ini                  # Test configuration
├── project/
│   ├── settings.py             # Django settings
│   ├── urls.py                 # Root URL config
│   └── wsgi.py                 # WSGI entry point
├── blog/
│   ├── models.py               # Database models
│   ├── serializers.py          # DRF serializers
│   ├── views.py                # API views
│   ├── urls.py                 # App URL config
│   ├── admin.py                # Django admin config
│   ├── factories.py            # Test data factories
│   └── tests/
│       ├── test_models.py
│       ├── test_serializers.py
│       └── test_views.py
└── staticfiles/                # Collected static files
```

**Conventions:**
- One app per domain concept (`blog`, `users`, `comments`)
- `factories.py` alongside models for test data
- `tests/` directory with descriptive filenames
- Keep `views.py` lean - extract business logic to `services.py` if needed

---

## Development Workflow

### Starting Development

```bash
# 1. Start services
docker-compose up -d

# 2. Apply migrations
docker-compose exec backend python manage.py migrate

# 3. Create superuser (first time only)
docker-compose exec backend python manage.py createsuperuser

# 4. Run development server (if not using Docker)
python manage.py runserver
```

### Making Changes

```bash
# 1. Create/modify models
# 2. Generate migration
docker-compose exec backend python manage.py makemigrations

# 3. Apply migration
docker-compose exec backend python manage.py migrate

# 4. Write tests
# 5. Run tests
docker-compose exec backend pytest -x

# 6. Commit only after tests pass
```

### Before Committing

```bash
# Run full test suite
docker-compose exec backend pytest

# Check code quality
docker-compose exec backend flake8 .

# Verify migrations
docker-compose exec backend python manage.py makemigrations --check --dry-run
```

---

## Production Deployment

### Checklist

- [ ] `DEBUG=False` in environment
- [ ] `SECRET_KEY` from secure source
- [ ] `ALLOWED_HOSTS` configured
- [ ] Database backed up
- [ ] Static files collected (`collectstatic`)
- [ ] Migrations applied
- [ ] Gunicorn/uWSGI configured
- [ ] nginx reverse proxy configured
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Monitoring configured (Sentry, logs)

### Environment Variables

```bash
# Production .env (example)
DEBUG=False
SECRET_KEY=<random-50-char-string>
DATABASE_URL=postgresql://user:password@db:5432/production_db
ALLOWED_HOSTS=example.com,www.example.com
CORS_ALLOWED_ORIGINS=https://example.com
```

---

*This example demonstrates a production-ready Django REST API with best practices for models, serializers, testing, and deployment.*
