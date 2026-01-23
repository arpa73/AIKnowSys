# Codebase Essentials - FastAPI + Python

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Backend:**
- Python 3.11+
- FastAPI 0.108
- Pydantic 2.5 (validation)
- SQLAlchemy 2.0 (ORM)
- Alembic (migrations)

**Database:**
- PostgreSQL 15
- asyncpg (async driver)

**Authentication:**
- python-jose (JWT)
- passlib (password hashing)
- bcrypt

**Testing:**
- pytest 7.4
- pytest-asyncio 0.21
- httpx (async HTTP client for tests)
- faker (test data generation)

**Infrastructure:**
- Docker & Docker Compose
- uvicorn (ASGI server)
- nginx (reverse proxy)

**Code Quality:**
- ruff (linter + formatter, replaces flake8/black)
- mypy (type checking)
- pre-commit hooks

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **Python Tests** | `docker-compose exec backend pytest -x` | All tests pass |
| **Type Checking** | `docker-compose exec backend mypy app/` | No type errors |
| **Linting** | `docker-compose exec backend ruff check .` | No linting errors |
| **Format Check** | `docker-compose exec backend ruff format --check .` | No formatting issues |
| **Database Migration** | `docker-compose exec backend alembic upgrade head` | No migration errors |

---

## Core Patterns

### 1. API Endpoints (Path Operations)

**Pattern: Router + Pydantic Schemas + Dependency Injection**

```python
# app/schemas/article.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=10)
    published: bool = False

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=10)
    published: bool | None = None

class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

# app/routers/articles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse
from app.models.article import Article
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/articles", tags=["articles"])

@router.get("/", response_model=list[ArticleResponse])
async def list_articles(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all articles with pagination."""
    result = await db.execute(
        select(Article)
        .offset(skip)
        .limit(limit)
        .order_by(Article.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get single article by ID."""
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    return article

@router.post("/", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_data: ArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new article."""
    article = Article(
        **article_data.model_dump(),
        author_id=current_user.id
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article

@router.patch("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update existing article."""
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update only provided fields
    update_data = article_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)
    
    await db.commit()
    await db.refresh(article)
    return article

@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete article."""
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(article)
    await db.commit()
```

**Why:**
- Pydantic schemas provide automatic validation + OpenAPI docs
- Dependency injection (`Depends`) enables clean separation
- Type hints enable IDE autocomplete + mypy checking
- Async/await for non-blocking I/O

**Gotchas:**
- ❌ Don't use `response_model_exclude_unset=True` globally (loses defaults)
- ✅ Use `model_dump(exclude_unset=True)` for partial updates
- ✅ Always await database operations in async functions

---

### 2. Database Models (SQLAlchemy 2.0)

**Pattern: Declarative Models + Async Session**

```python
# app/models/base.py
from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

# app/models/article.py
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Article(Base, TimestampMixin):
    __tablename__ = "articles"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationships
    author: Mapped["User"] = relationship(back_populates="articles")
    
    def __repr__(self) -> str:
        return f"<Article {self.id}: {self.title}>"

# app/models/user.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Relationships
    articles: Mapped[list["Article"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan"
    )
```

**Database Connection:**
```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Why:**
- SQLAlchemy 2.0 style with `Mapped` provides better type hints
- Async session prevents blocking I/O
- TimestampMixin ensures consistent timestamp handling
- Relationships enable eager loading to prevent N+1 queries

**Gotchas:**
- ❌ Don't mix sync and async SQLAlchemy (use `async_` variants)
- ✅ Use `expire_on_commit=False` to access attributes after commit
- ✅ Always use `await` for database operations

---

### 3. Authentication (JWT)

**Pattern: OAuth2 Password Bearer + JWT Tokens**

```python
# app/auth/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

# app/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    
    return user

# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.auth.security import verify_password, create_access_token
from app.config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Find user by username
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
```

**Why:**
- OAuth2 standard for token-based auth
- JWT stateless (no server-side session storage)
- bcrypt for secure password hashing
- Dependency injection for clean auth checks

**Gotchas:**
- ❌ Don't store sensitive data in JWT (it's not encrypted, only signed)
- ✅ Use strong SECRET_KEY (generate with `openssl rand -hex 32`)
- ✅ Set reasonable token expiration (15-60 minutes)

---

### 4. Configuration Management

**Pattern: Pydantic Settings + Environment Variables**

```python
# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Application
    APP_NAME: str = "FastAPI Blog"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: PostgresDsn
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

settings = Settings()
```

**Usage:**
```python
from app.config import settings

print(settings.DATABASE_URL)
print(settings.SECRET_KEY)
```

**Environment File (.env):**
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here
DEBUG=True
```

**Why:**
- Type-safe configuration with validation
- Automatic .env file loading
- IDE autocomplete for settings
- Clear single source for all config

**Gotchas:**
- ❌ Don't commit .env file (add to .gitignore)
- ✅ Provide .env.example with dummy values
- ✅ Validate required settings on startup

---

### 5. Database Migrations (Alembic)

**Pattern: Auto-Generate Migrations from Models**

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.models.base import Base
from app.models.user import User
from app.models.article import Article
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))

target_metadata = Base.metadata

async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()
```

**Commands:**
```bash
# Create new migration
alembic revision --autogenerate -m "Add articles table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

**Why:**
- Auto-generates migrations from model changes
- Version control for database schema
- Safe rollback capability
- Works with async SQLAlchemy

**Gotchas:**
- ❌ Don't edit applied migrations (create new one)
- ✅ Always review auto-generated migrations before applying
- ✅ Import all models in `env.py` for proper detection

---

## Testing Patterns

### API Testing

**Pattern: pytest + httpx + TestClient**

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.database import get_db
from app.models.base import Base

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_db"

@pytest.fixture
async def db_session():
    """Create fresh database for each test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    AsyncTestSession = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with AsyncTestSession() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    """HTTP client with overridden database dependency."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

# tests/test_articles.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_article(client: AsyncClient, auth_token):
    response = await client.post(
        "/articles/",
        json={
            "title": "Test Article",
            "content": "This is test content",
            "published": True
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Article"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_list_articles(client: AsyncClient):
    response = await client.get("/articles/")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_article_not_found(client: AsyncClient):
    response = await client.get("/articles/999")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Article not found"
```

**Why:**
- Isolated tests with fresh database
- Async testing matches async codebase
- Dependency override for test database
- Type hints for test fixtures

**Gotchas:**
- ❌ Don't use real database for tests (data contamination)
- ✅ Use separate test database URL
- ✅ Always clean up database after tests

---

## Project Invariants

**These rules MUST be followed:**

1. **Type Hints:** All functions must have type hints (enforced by mypy)
2. **Async/Await:** All I/O operations must be async
3. **Pydantic Schemas:** All request/response bodies use Pydantic models
4. **Dependency Injection:** Use `Depends()` for database, auth, etc.
5. **Error Handling:** Raise `HTTPException` for client errors
6. **Database Transactions:** Use async context managers for sessions
7. **Password Security:** Never store plain passwords, always hash
8. **API Documentation:** OpenAPI docs auto-generated at `/docs`

---

## Common Gotchas

### 1. Mixing Sync and Async

**Problem:**
```python
# ❌ BAD: Blocking sync call in async function
@router.get("/")
async def get_articles(db: Session = Depends(get_db)):
    articles = db.query(Article).all()  # Blocks event loop!
    return articles
```

**Solution:**
```python
# ✅ GOOD: Async all the way
@router.get("/")
async def get_articles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article))
    articles = result.scalars().all()
    return articles
```

### 2. Forgetting `await`

**Problem:**
```python
# ❌ BAD: Forgot await, returns coroutine object
article = db.get(Article, article_id)
```

**Solution:**
```python
# ✅ GOOD: Always await async functions
article = await db.get(Article, article_id)
```

### 3. N+1 Query Problem

**Problem:**
```python
# ❌ BAD: Lazy loading causes N+1 queries
articles = await db.execute(select(Article))
for article in articles:
    print(article.author.name)  # Separate query for each!
```

**Solution:**
```python
# ✅ GOOD: Eager load with joinedload
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Article).options(selectinload(Article.author))
)
articles = result.scalars().all()
for article in articles:
    print(article.author.name)  # No extra queries
```

### 4. Pydantic Schema vs SQLAlchemy Model

**Problem:**
```python
# ❌ BAD: Returning SQLAlchemy model directly
@router.get("/articles/{id}")
async def get_article(id: int, db: AsyncSession = Depends(get_db)):
    article = await db.get(Article, id)
    return article  # Has relationships, passwords, etc.
```

**Solution:**
```python
# ✅ GOOD: Use response_model to filter fields
@router.get("/articles/{id}", response_model=ArticleResponse)
async def get_article(id: int, db: AsyncSession = Depends(get_db)):
    article = await db.get(Article, id)
    return article  # Pydantic serializes only defined fields
```

---

## Architecture Decisions

### Why FastAPI?
- Fastest Python web framework (on par with Node.js/Go)
- Automatic OpenAPI docs generation
- Built-in request validation via Pydantic
- Native async/await support
- Excellent type hint integration

### Why SQLAlchemy 2.0?
- Type-safe ORM with `Mapped` annotations
- Async support for non-blocking I/O
- Migration system via Alembic
- Prevents N+1 queries with eager loading

### Why Pydantic?
- Data validation with type hints
- Automatic JSON serialization
- Clear error messages for API clients
- Config from environment variables

### Why JWT over Sessions?
- Stateless (scales horizontally)
- Works across microservices
- Mobile-friendly (no cookies needed)
- Faster (no database lookup per request)

---

## File Organization

**Recommended structure:**
```
app/
├── main.py              # FastAPI app initialization
├── config.py            # Settings + environment variables
├── database.py          # Database connection
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── base.py
│   ├── user.py
│   └── article.py
├── schemas/             # Pydantic schemas
│   ├── __init__.py
│   ├── user.py
│   └── article.py
├── routers/             # API endpoints
│   ├── __init__.py
│   ├── auth.py
│   └── articles.py
├── auth/                # Authentication logic
│   ├── __init__.py
│   ├── security.py
│   └── dependencies.py
└── tests/
    ├── conftest.py
    └── test_articles.py

alembic/
├── versions/            # Migration files
└── env.py               # Alembic config

requirements.txt
pyproject.toml
docker-compose.yml
```

---

## Next Steps for New Developers

1. **Read FastAPI docs** - https://fastapi.tiangolo.com
2. **Understand async/await** - Critical for performance
3. **Practice SQLAlchemy** - Complex but powerful
4. **Test with pytest** - Write tests from day one
5. **Use `/docs` endpoint** - Interactive API documentation
6. **Profile with `time`** - Identify slow queries early

---

**Remember:** FastAPI is async-first. Embrace async/await for maximum performance.
