# Codebase Essentials - {{PROJECT_NAME}}

**Created:** {{DATE}}  
**Last Updated:** {{DATE}}  
**Status:** {{STATUS}}

---

## Technology Stack

**Runtime:**
- Python {{PYTHON_VERSION}} (3.10+ recommended)
- FastAPI 0.108+
- Pydantic 2.5+ (validation & serialization)

**Database:**
- {{DATABASE}} (e.g., PostgreSQL, MySQL, SQLite)
- {{ORM}} (e.g., SQLAlchemy 2.0, Tortoise ORM, Beanie)
- {{MIGRATION_TOOL}} (e.g., Alembic, Aerich)

**Authentication:**
- python-jose[cryptography] (JWT)
- passlib[bcrypt] (password hashing)
- {{AUTH_LIB}} (e.g., FastAPI-Users, OAuth2)

**Validation:**
- Pydantic 2.x (schema validation)
- email-validator (email validation)

**Testing:**
- pytest 7.4+
- pytest-asyncio 0.21+
- httpx (async HTTP client)
- faker (test data generation)

**Infrastructure:**
- Docker & Docker Compose
- uvicorn (ASGI server)
- nginx (optional reverse proxy)

**Code Quality:**
- ruff (linter + formatter, replaces flake8/black)
- mypy (type checking)
- pre-commit hooks

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **Python Code** | `{{TYPE_CHECK_CMD}}` | No type errors |
| **Tests** | `{{TEST_CMD}}` | All tests pass |
| **Linting** | `{{LINT_CMD}}` | No lint errors |
| **Format** | `{{FORMAT_CHECK_CMD}}` | No formatting issues |
| **Database** | `{{DB_MIGRATE_CMD}}` | No migration errors |
| **API Docs** | Visit `/docs` | Swagger UI loads |

**Example commands:**
```bash
# Type checking
mypy app/

# Tests
pytest -v

# Linting
ruff check .

# Format check
ruff format --check .

# Database migration
alembic upgrade head
```

---

## Project Structure

```
{{PROJECT_NAME}}/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Settings & environment
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy/ORM models
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user.py
│   ├── schemas/             # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routers/             # API endpoints (path operations)
│   │   ├── __init__.py
│   │   └── users.py
│   ├── services/            # Business logic layer
│   │   ├── __init__.py
│   │   └── user_service.py
│   ├── auth/                # Authentication logic
│   │   ├── __init__.py
│   │   ├── security.py      # JWT & password utils
│   │   └── dependencies.py  # Auth dependencies
│   ├── middleware/          # Custom middleware
│   │   └── cors.py
│   └── utils/               # Helper functions
│       └── logger.py
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── tests/
│   ├── conftest.py          # Test fixtures
│   ├── unit/                # Unit tests
│   └── integration/         # API endpoint tests
├── docker-compose.yml       # Local dev environment
├── pyproject.toml           # Dependencies & config
└── requirements.txt         # Production dependencies
```

---

## Core Patterns

### 1. Router-Based Architecture (Routers → Services → Models)

**✅ GOOD: Separated Concerns**

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=50)

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime

# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Business logic for user operations."""
    
    async def create_user(self, db: AsyncSession, user_data: UserCreate) -> User:
        # Check if email exists
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create user
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> User:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    async def update_user(
        self, db: AsyncSession, user_id: int, user_data: UserUpdate
    ) -> User:
        user = await self.get_user_by_id(db, user_id)
        
        # Update only provided fields
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        return user

user_service = UserService()

# app/routers/users.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import user_service
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user."""
    return await user_service.create_user(db, user_data)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user by ID (authenticated)."""
    return await user_service.get_user_by_id(db, user_id)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update user (must be owner)."""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    return await user_service.update_user(db, user_id, user_data)

# app/main.py
from fastapi import FastAPI
from app.routers import users
from app.middleware.cors import setup_cors

app = FastAPI(title="{{PROJECT_NAME}}", version="1.0.0")

setup_cors(app)

app.include_router(users.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to {{PROJECT_NAME}} API"}
```

**❌ BAD: Everything in one place**

```python
# ❌ No separation of concerns
@app.post("/users")
async def create_user(email: str, password: str):
    user = User(email=email, password=password)  # No validation! No hashing!
    db.add(user)
    await db.commit()
    return user
```

**Why:** Router → Service → Model architecture separates HTTP concerns from business logic. Routers handle requests/responses, services contain business logic, models represent data.

### 2. Error Handling (HTTPException + Custom Exception Handler)

**✅ GOOD: Centralized Error Handling**

```python
# app/exceptions.py
from fastapi import HTTPException, status

class AppException(HTTPException):
    """Base exception for application errors."""
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundError(AppException):
    def __init__(self, resource: str, identifier: int | str):
        super().__init__(
            detail=f"{resource} with id {identifier} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_401_UNAUTHORIZED
        )

# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "details": [
                {
                    "field": ".".join(str(x) for x in err["loc"]),
                    "message": err["msg"],
                    "type": err["type"]
                }
                for err in exc.errors()
            ]
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected errors."""
    # Log the error (don't expose in production!)
    import logging
    logging.error(f"Unexpected error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error"}
    )
```

**Usage:**

```python
# In service layer
if not article:
    raise NotFoundError("Article", article_id)

if article.author_id != user_id:
    raise HTTPException(status_code=403, detail="Not authorized")
```

**❌ BAD: Manual error responses everywhere**

```python
# ❌ Inconsistent error handling
if not user:
    return {"error": "not found"}  # Wrong! Not an HTTP response

# ❌ No error details
if not article:
    raise HTTPException(status_code=404)  # No detail message!
```

**Why:** Centralized error handling ensures consistent error format, proper HTTP status codes, and prevents information leakage in production.

---

## Common Patterns

### 1. Authentication with JWT (python-jose)

**✅ GOOD: JWT Token Authentication**

```python
# app/auth/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
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

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# app/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.auth.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = await db.get(User, int(user_id))
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (check if account is disabled)."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# app/routers/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.auth.security import verify_password, create_access_token
from app.schemas.auth import Token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """OAuth2 compatible token login."""
    # Find user by email or username
    result = await db.execute(
        select(User).where(
            (User.email == form_data.username) | 
            (User.username == form_data.username)
        )
    )
    user = result.scalar_one_or_none()
    
    # Verify credentials
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    return await user_service.create_user(db, user_data)

# app/schemas/auth.py
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int | None = None
```

**❌ BAD: Insecure authentication**

```python
# ❌ No password hashing!
@app.post("/login")
async def login(email: str, password: str):
    user = await db.get_user(email)
    if user.password == password:  # Plaintext comparison!
        return {"token": "12345"}  # Hardcoded token!

# ❌ No token expiration
token = jwt.encode({"user_id": 1}, SECRET_KEY)  # Never expires!
```

**Why:** JWT provides stateless authentication. Password hashing with bcrypt prevents credential theft. Token expiration limits exposure window.

### 2. Dependency Injection Patterns

**✅ GOOD: Reusable Dependencies**

```python
# app/dependencies.py
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User

class CommonQueryParams:
    """Common pagination parameters."""
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Max items to return")
    ):
        self.skip = skip
        self.limit = limit

async def get_owner_or_admin(
    resource_user_id: int,
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify user owns resource or is admin."""
    if current_user.id != resource_user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Usage in router
@router.get("/articles/", response_model=list[ArticleResponse])
async def list_articles(
    commons: CommonQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Article)
        .offset(commons.skip)
        .limit(commons.limit)
        .order_by(Article.created_at.desc())
    )
    return result.scalars().all()

@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(get_owner_or_admin)
):
    # owner dependency already verified authorization
    article = await db.get(Article, article_id)
    await db.delete(article)
    await db.commit()
    return {"message": "Article deleted"}
```

**Why:** Dependency injection reduces code duplication, improves testability (easy to override), and enforces consistent patterns.

### 3. SQLAlchemy Async Patterns

**✅ GOOD: Efficient Async Queries**

```python
# app/models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
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

# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True  # Verify connections before using
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False  # Allow access to attributes after commit
)

async def get_db() -> AsyncSession:
    """FastAPI dependency for database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# app/services/article_service.py
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.article import Article

class ArticleService:
    async def list_with_authors(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Article]:
        """List articles with authors (prevents N+1 queries)."""
        result = await db.execute(
            select(Article)
            .options(selectinload(Article.author))  # Eager load
            .offset(skip)
            .limit(limit)
            .order_by(Article.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_with_author(self, db: AsyncSession, article_id: int) -> Article | None:
        """Get article with author relationship loaded."""
        result = await db.execute(
            select(Article)
            .options(selectinload(Article.author))
            .where(Article.id == article_id)
        )
        return result.scalar_one_or_none()
    
    async def create_article(
        self, db: AsyncSession, article_data: ArticleCreate, user_id: int
    ) -> Article:
        """Create new article."""
        article = Article(
            **article_data.model_dump(),
            author_id=user_id
        )
        db.add(article)
        await db.flush()  # Get ID without committing
        await db.refresh(article)
        return article
    
    async def update_article(
        self, db: AsyncSession, article: Article, update_data: ArticleUpdate
    ) -> Article:
        """Update existing article."""
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(article, field, value)
        
        await db.flush()
        await db.refresh(article)
        return article
```

**❌ BAD: N+1 queries and blocking calls**

```python
# ❌ N+1 query problem
articles = await db.execute(select(Article))
for article in articles.scalars():
    print(article.author.name)  # Separate query for each!

# ❌ Blocking sync query in async function
def get_articles(db: Session):  # Sync session!
    return db.query(Article).all()  # Blocks event loop
```

**Why:** Async SQLAlchemy prevents blocking I/O. Eager loading with `selectinload()` prevents N+1 queries. Type hints with `Mapped[]` enable IDE autocomplete.

### 4. Pydantic V2 Validation Patterns

**✅ GOOD: Advanced Pydantic Validation**

```python
# app/schemas/article.py
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from datetime import datetime
from typing import Annotated

class ArticleBase(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=200)]
    content: Annotated[str, Field(min_length=10)]
    published: bool = False
    tags: list[str] = Field(default_factory=list, max_length=10)

class ArticleCreate(ArticleBase):
    @field_validator('title')
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()
    
    @field_validator('tags')
    @classmethod
    def tags_must_be_lowercase(cls, v: list[str]) -> list[str]:
        return [tag.lower().strip() for tag in v]

class ArticleUpdate(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=200)] | None = None
    content: Annotated[str, Field(min_length=10)] | None = None
    published: bool | None = None
    tags: list[str] | None = None
    
    @model_validator(mode='after')
    def check_at_least_one_field(self):
        if not any(self.model_dump(exclude_unset=True).values()):
            raise ValueError('At least one field must be provided')
        return self

class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)  # Pydantic V2
    
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

class ArticleWithAuthor(ArticleResponse):
    author: "UserResponse"  # Nested schema

# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: EmailStr
    username: str
    created_at: datetime

# Pagination schemas
class PaginatedResponse(BaseModel):
    items: list[ArticleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
```

**❌ BAD: No validation**

```python
# ❌ No type hints or validation
class ArticleCreate(BaseModel):
    title: str  # Could be empty!
    content: str  # No length validation
    # Missing other fields
```

**Why:** Pydantic V2 validates input automatically, generates clear error messages, and provides type safety. `ConfigDict` replaces old `Config` class.

### 5. Background Tasks

**✅ GOOD: FastAPI Background Tasks**

```python
# app/tasks/email.py
import logging
from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)

async def send_email_async(email: str, subject: str, body: str):
    """Send email asynchronously (mock implementation)."""
    # In production, use aiosmtplib or httpx with email service API
    logger.info(f"Sending email to {email}: {subject}")
    # await aiosmtplib.send(...)
    await asyncio.sleep(2)  # Simulate email sending
    logger.info(f"Email sent to {email}")

# app/routers/users.py
@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register user and send welcome email."""
    user = await user_service.create_user(db, user_data)
    
    # Queue background task (doesn't block response)
    background_tasks.add_task(
        send_email_async,
        email=user.email,
        subject="Welcome!",
        body=f"Welcome to our platform, {user.username}!"
    )
    
    return user
```

**For long-running tasks, use Celery or ARQ:**

```python
# app/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    "{{PROJECT_NAME}}",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

@celery_app.task
def process_large_file(file_path: str):
    """Process large file asynchronously."""
    # Heavy processing here
    pass

# Usage in router
@router.post("/upload")
async def upload_file(file: UploadFile):
    # Save file
    file_path = save_file(file)
    
    # Queue Celery task
    process_large_file.delay(file_path)
    
    return {"message": "File upload queued"}
```

**Why:** BackgroundTasks for simple async work. Celery/ARQ for distributed task queues and scheduled jobs.

### 6. WebSocket Support

**✅ GOOD: WebSocket Endpoint**

```python
# app/routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

router = APIRouter()

class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
    
    async def send_personal_message(self, message: str, client_id: str):
        websocket = self.active_connections.get(client_id)
        if websocket:
            await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            # Echo back to sender
            await manager.send_personal_message(f"You wrote: {data}", client_id)
            
            # Broadcast to all
            await manager.broadcast(f"Client {client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"Client {client_id} left the chat")

# Include in main app
from app.routers import websocket
app.include_router(websocket.router, prefix="/api")
```

**Why:** WebSockets enable real-time bidirectional communication for chat, notifications, live updates.

### 7. Testing with pytest

**✅ GOOD: Comprehensive Test Suite**

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.database import get_db
from app.models.base import Base
from app.config import settings

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
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
    
    await engine.dispose()

@pytest.fixture
async def client(db_session):
    """HTTP client with overridden database dependency."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(db_session):
    """Create test user."""
    from app.models.user import User
    from app.auth.security import get_password_hash
    
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpass123")
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
async def auth_token(client, test_user):
    """Get authentication token."""
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    return response.json()["access_token"]

# tests/test_articles.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_article(client: AsyncClient, auth_token: str):
    """Test creating an article."""
    response = await client.post(
        "/api/articles/",
        json={
            "title": "Test Article",
            "content": "This is test content that is long enough",
            "published": True
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Article"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_create_article_unauthorized(client: AsyncClient):
    """Test creating article without auth returns 401."""
    response = await client.post(
        "/api/articles/",
        json={"title": "Test", "content": "Content here"}
    )
    
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_article_validation_error(client: AsyncClient, auth_token: str):
    """Test validation error for invalid data."""
    response = await client.post(
        "/api/articles/",
        json={"title": "", "content": "short"},  # Invalid
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "details" in data or "detail" in data

@pytest.mark.asyncio
async def test_list_articles(client: AsyncClient, auth_token: str, db_session):
    """Test listing articles with pagination."""
    # Create test articles
    from app.models.article import Article
    from app.models.user import User
    
    user = await db_session.get(User, 1)
    
    for i in range(5):
        article = Article(
            title=f"Article {i}",
            content=f"Content {i}" * 10,
            author_id=user.id
        )
        db_session.add(article)
    await db_session.commit()
    
    # List articles
    response = await client.get("/api/articles/?skip=0&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
```

**Why:** pytest-asyncio enables testing async code. Fixtures provide reusable test data. Dependency override allows testing with test database.

---

## Critical Invariants

**Rules that MUST NEVER be violated:**

1. **Type Hints:** All functions must have type hints (enforced by mypy)
2. **Async/Await:** All I/O operations (database, HTTP, file) must be async
3. **Pydantic Validation:** All request/response bodies use Pydantic models
4. **Dependency Injection:** Use `Depends()` for database sessions, auth, config
5. **Password Security:** Never store plain passwords - always hash with bcrypt
6. **HTTPException:** Raise `HTTPException` for all client errors (4xx)
7. **Response Models:** Always specify `response_model` in path operations
8. **Database Sessions:** Use `AsyncSession` with `async with` or dependency
9. **No SQL Injection:** Use SQLAlchemy ORM, never raw SQL string concatenation
10. **TDD for Features:** Write tests FIRST for new features (RED-GREEN-REFACTOR)

---

## Testing Patterns

**Test Organization:**
```
tests/
├── conftest.py          # Shared fixtures
├── unit/
│   ├── test_services.py
│   └── test_utils.py
└── integration/
    ├── test_auth.py
    ├── test_users.py
    └── test_articles.py
```

**Naming:** `test_*.py` for all test files

**Unit Tests (Services/Utils):**
- Mock database calls
- Test business logic
- Test error conditions

**Integration Tests (API Endpoints):**
- Use test database
- Test HTTP endpoints
- Test authentication/authorization

**Coverage Target:** 80% for services, 70% for routers

**Run tests:**
```bash
# All tests
pytest -v

# Specific test file
pytest tests/test_articles.py -v

# With coverage
pytest --cov=app --cov-report=html

# Only fast tests (skip slow integration tests)
pytest -m "not slow"
```

---

## Performance Patterns

### 1. Database Query Optimization

```python
# ✅ GOOD: Select only needed fields + eager loading
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Article.id, Article.title, Article.created_at)
    .options(selectinload(Article.author))  # Prevent N+1
    .limit(100)
)

# ❌ BAD: Fetch all fields + lazy loading
articles = await db.execute(select(Article))
for article in articles.scalars():
    print(article.author.name)  # N+1 queries!
```

### 2. Caching with Redis

```python
# app/cache.py
from redis.asyncio import Redis
from app.config import settings
import json

redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_cached(key: str):
    """Get value from cache."""
    value = await redis_client.get(key)
    return json.loads(value) if value else None

async def set_cached(key: str, value: any, expire: int = 300):
    """Set value in cache with expiration."""
    await redis_client.setex(key, expire, json.dumps(value))

# Usage in router
@router.get("/articles/{article_id}")
async def get_article(article_id: int, db: AsyncSession = Depends(get_db)):
    # Try cache first
    cache_key = f"article:{article_id}"
    cached = await get_cached(cache_key)
    if cached:
        return cached
    
    # Fetch from database
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Cache for 5 minutes
    article_dict = ArticleResponse.model_validate(article).model_dump()
    await set_cached(cache_key, article_dict, expire=300)
    
    return article_dict
```

### 3. Connection Pooling

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,           # Max connections in pool
    max_overflow=10,        # Additional connections when pool full
    pool_pre_ping=True,     # Verify connection health
    pool_recycle=3600       # Recycle connections after 1 hour
)
```

### 4. Response Compression

```python
# app/middleware/compression.py
from fastapi import FastAPI
from starlette.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## Common Gotchas

### 1. Forgetting `await`

```python
# ❌ BAD: Forgot await, returns coroutine object
article = db.get(Article, article_id)  # Returns coroutine!

# ✅ GOOD: Always await async functions
article = await db.get(Article, article_id)
```

### 2. Mixing Sync and Async

```python
# ❌ BAD: Blocking sync call in async function
@router.get("/")
async def get_articles(db: Session = Depends(get_db)):  # Sync session!
    articles = db.query(Article).all()  # Blocks event loop!

# ✅ GOOD: Async all the way
@router.get("/")
async def get_articles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article))
    articles = result.scalars().all()
```

### 3. Not Using response_model

```python
# ❌ BAD: Returns SQLAlchemy model with all fields
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    return user  # Exposes hashed_password field!

# ✅ GOOD: Use response_model to filter fields
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    return user  # Only UserResponse fields returned
```

### 4. Pydantic V2 Migration Issues

```python
# ❌ BAD: Using deprecated Pydantic V1 syntax
class UserResponse(BaseModel):
    class Config:  # Deprecated in V2!
        orm_mode = True

# ✅ GOOD: Pydantic V2 syntax
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
```

### 5. Not Handling Database Sessions Properly

```python
# ❌ BAD: Session might not close
async def get_articles():
    session = AsyncSessionLocal()
    articles = await session.execute(select(Article))
    return articles.scalars().all()  # Session never closed!

# ✅ GOOD: Use dependency injection
@router.get("/articles")
async def get_articles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article))
    return result.scalars().all()  # Dependency handles session lifecycle
```

### 6. Weak JWT Secrets

```python
# ❌ BAD: Weak or hardcoded secret
SECRET_KEY = "secret"  # Easily guessable!

# ✅ GOOD: Strong random secret from environment
SECRET_KEY = os.getenv("SECRET_KEY")  # Generate with: openssl rand -hex 32
```

### 7. N+1 Query Problem

```python
# ❌ BAD: Lazy loading causes N+1 queries
articles = await db.execute(select(Article))
for article in articles.scalars():
    print(article.author.name)  # Separate query for each!

# ✅ GOOD: Eager load with selectinload
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Article).options(selectinload(Article.author))
)
for article in result.scalars():
    print(article.author.name)  # Single query with JOIN
```

---

## Dependencies & Versions

**Major Dependencies:**
- `fastapi>=0.108.0`
- `uvicorn[standard]>=0.25.0`
- `pydantic>=2.5.0`
- `pydantic-settings>=2.1.0`
- `sqlalchemy[asyncio]>=2.0.0`
- `asyncpg>=0.29.0` (PostgreSQL) or `aiomysql` (MySQL)
- `alembic>=1.13.0`
- `python-jose[cryptography]>=3.3.0`
- `passlib[bcrypt]>=1.7.4`
- `python-multipart>=0.0.6` (file uploads)

**Dev Dependencies:**
- `pytest>=7.4.0`
- `pytest-asyncio>=0.21.0`
- `httpx>=0.25.0`
- `faker>=20.0.0`
- `ruff>=0.1.0`
- `mypy>=1.7.0`

**Update Strategy:**
- Security updates immediately (`pip list --outdated`)
- Minor/patch updates monthly
- Major version updates with testing
- Check `pip-audit` for vulnerabilities

---

## Build & Deployment

**Local Development:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server with hot reload
uvicorn app.main:app --reload --port 8000
```

**Production:**
```bash
# Install production dependencies
pip install -r requirements.txt --no-dev

# Run migrations
alembic upgrade head

# Start with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Docker:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Environment Files:**
- `.env` - Local development (gitignored)
- `.env.example` - Template (committed)
- `.env.test` - Test environment
- Production env vars via hosting platform (Render, Railway, etc.)

**Deployment Checklist:**
- [ ] All tests passing (`pytest`)
- [ ] Type checking passing (`mypy app/`)
- [ ] Linting passing (`ruff check .`)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SECRET_KEY is strong (32+ chars)
- [ ] DEBUG=False in production
- [ ] CORS origins configured correctly
- [ ] HTTPS enabled
- [ ] Rate limiting configured

---

## Key Architectural Decisions

### Why FastAPI?
- **Performance:** Fastest Python web framework (on par with Node.js)
- **Automatic Docs:** OpenAPI/Swagger docs generated automatically
- **Type Safety:** Built-in Pydantic validation + type hints
- **Async Support:** Native async/await for high concurrency
- **Developer Experience:** Great autocomplete, clear error messages

### Why SQLAlchemy 2.0?
- **Type Safety:** `Mapped[]` annotations enable IDE autocomplete
- **Async Support:** Non-blocking database I/O
- **ORM + Raw SQL:** Flexibility when needed
- **Migration System:** Alembic for version control

### Why Pydantic V2?
- **Runtime Validation:** TypeScript types alone don't validate at runtime
- **Type Inference:** Schemas generate Python types automatically
- **Performance:** Pydantic V2 is ~17x faster than V1
- **Clear Errors:** Detailed validation error messages for clients

### Why JWT over Sessions?
- **Stateless:** Scales horizontally (no server-side storage)
- **Microservices:** Works across multiple services
- **Mobile-Friendly:** No cookies needed
- **Fast:** No database lookup per request

### Why Dependency Injection?
- **Testability:** Easy to override dependencies in tests
- **Reusability:** Share common logic (auth, pagination, etc.)
- **Clean Code:** Separates concerns clearly
- **Type Safety:** FastAPI validates dependencies

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Async Python Guide](https://realpython.com/async-io-python/)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)

---

**Last Updated:** {{DATE}}  
**Next Review:** {{NEXT_REVIEW_DATE}}
