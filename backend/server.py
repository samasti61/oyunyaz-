from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 10080))

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    game_name: str
    category: str
    tags: List[str] = []
    rating: Optional[int] = None  # 1-10
    cover_image: Optional[str] = None
    author_id: str
    author_username: str
    collaborators: List[str] = []  # user IDs
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    title: str
    content: str
    game_name: str
    category: str
    tags: List[str] = []
    rating: Optional[int] = Field(None, ge=1, le=10)
    cover_image: Optional[str] = None

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    game_name: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    rating: Optional[int] = Field(None, ge=1, le=10)
    cover_image: Optional[str] = None

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    review_id: str
    author_id: str
    author_username: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    content: str

class Like(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    review_id: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIAssistRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class AIAssistResponse(BaseModel):
    suggestion: str

class WordExplainRequest(BaseModel):
    word: str
    context: str

class WordExplainResponse(BaseModel):
    explanation: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user_doc is None:
        raise credentials_exception
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(email=user_data.email, username=user_data.username)
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email})
    if not user_doc or not verify_password(user_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Review routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    review = Review(
        **review_data.model_dump(),
        author_id=current_user.id,
        author_username=current_user.username
    )
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    review_dict['updated_at'] = review_dict['updated_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    return review

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews(skip: int = 0, limit: int = 20, category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
        if isinstance(review.get('updated_at'), str):
            review['updated_at'] = datetime.fromisoformat(review['updated_at'])
    
    return reviews

@api_router.get("/reviews/{review_id}", response_model=Review)
async def get_review(review_id: str):
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if isinstance(review.get('created_at'), str):
        review['created_at'] = datetime.fromisoformat(review['created_at'])
    if isinstance(review.get('updated_at'), str):
        review['updated_at'] = datetime.fromisoformat(review['updated_at'])
    
    return Review(**review)

@api_router.put("/reviews/{review_id}", response_model=Review)
async def update_review(review_id: str, review_data: ReviewUpdate, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review['author_id'] != current_user.id and current_user.id not in review.get('collaborators', []):
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")
    
    update_data = {k: v for k, v in review_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    
    updated_review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if isinstance(updated_review.get('created_at'), str):
        updated_review['created_at'] = datetime.fromisoformat(updated_review['created_at'])
    if isinstance(updated_review.get('updated_at'), str):
        updated_review['updated_at'] = datetime.fromisoformat(updated_review['updated_at'])
    
    return Review(**updated_review)

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review['author_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    await db.reviews.delete_one({"id": review_id})
    await db.comments.delete_many({"review_id": review_id})
    await db.likes.delete_many({"review_id": review_id})
    
    return {"message": "Review deleted successfully"}

@api_router.post("/reviews/{review_id}/collaborators/{user_id}")
async def add_collaborator(review_id: str, user_id: str, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review['author_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can add collaborators")
    
    if user_id not in review.get('collaborators', []):
        await db.reviews.update_one({"id": review_id}, {"$push": {"collaborators": user_id}})
    
    return {"message": "Collaborator added successfully"}

# Comment routes
@api_router.post("/reviews/{review_id}/comments", response_model=Comment)
async def create_comment(review_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    comment = Comment(
        review_id=review_id,
        author_id=current_user.id,
        author_username=current_user.username,
        content=comment_data.content
    )
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    
    await db.comments.insert_one(comment_dict)
    await db.reviews.update_one({"id": review_id}, {"$inc": {"comments_count": 1}})
    
    return comment

@api_router.get("/reviews/{review_id}/comments", response_model=List[Comment])
async def get_comments(review_id: str):
    comments = await db.comments.find({"review_id": review_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for comment in comments:
        if isinstance(comment.get('created_at'), str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
    
    return comments

# Like routes
@api_router.post("/reviews/{review_id}/like")
async def toggle_like(review_id: str, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    existing_like = await db.likes.find_one({"review_id": review_id, "user_id": current_user.id})
    
    if existing_like:
        await db.likes.delete_one({"id": existing_like['id']})
        await db.reviews.update_one({"id": review_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "message": "Like removed"}
    else:
        like = Like(review_id=review_id, user_id=current_user.id)
        like_dict = like.model_dump()
        like_dict['created_at'] = like_dict['created_at'].isoformat()
        
        await db.likes.insert_one(like_dict)
        await db.reviews.update_one({"id": review_id}, {"$inc": {"likes_count": 1}})
        return {"liked": True, "message": "Review liked"}

@api_router.get("/reviews/{review_id}/liked")
async def check_liked(review_id: str, current_user: User = Depends(get_current_user)):
    like = await db.likes.find_one({"review_id": review_id, "user_id": current_user.id})
    return {"liked": like is not None}

# User profile routes
@api_router.get("/users/{user_id}", response_model=User)
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

@api_router.put("/users/me", response_model=User)
async def update_profile(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    if not update_dict:
        return current_user
    
    # Check if username already exists
    if 'username' in update_dict:
        existing = await db.users.find_one({"username": update_dict['username'], "id": {"$ne": current_user.id}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    await db.users.update_one({"id": current_user.id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.get("/users/{user_id}/reviews", response_model=List[Review])
async def get_user_reviews(user_id: str, skip: int = 0, limit: int = 20):
    reviews = await db.reviews.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
        if isinstance(review.get('updated_at'), str):
            review['updated_at'] = datetime.fromisoformat(review['updated_at'])
    
    return reviews

# AI routes
@api_router.post("/ai/assist", response_model=AIAssistResponse)
async def ai_assist(request: AIAssistRequest, current_user: User = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"assist-{current_user.id}-{datetime.now(timezone.utc).timestamp()}",
            system_message="""Sen oyun incelemeleri ve yaratıcı yazım konusunda uzman bir asistansın. 
            
KURALLAR:
- SADECE oyun incelemeleri, oyun analizleri ve yaratıcı yazım hakkında yardım et
- Küfür, argo, hakaret veya uygunsuz içerik asla kullanma ve öneri verme
- Kullanıcı küfür veya uygunsuz bir şey isterse kibarca reddet
- Her zaman profesyonel, yapıcı ve saygılı dil kullan
- Türkçe cevap ver
- Kısa ve öz önerilerde bulun (max 3-4 cümle)

Sadece oyun incelemeleri yazımına yardımcı ol."""
        ).with_model("openai", "gpt-5.2")
        
        prompt_text = request.prompt
        if request.context:
            prompt_text = f"Mevcut metin: {request.context}\n\nİstek: {request.prompt}"
        
        message = UserMessage(text=prompt_text)
        response = await chat.send_message(message)
        
        return AIAssistResponse(suggestion=response)
    except Exception as e:
        logger.error(f"AI assist error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI assistance failed")

@api_router.post("/ai/explain", response_model=WordExplainResponse)
async def explain_word(request: WordExplainRequest):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"explain-{datetime.now(timezone.utc).timestamp()}",
            system_message="""Sen oyun terimleri ve kelimeler konusunda uzman bir asistansın.

KURALLAR:
- SADECE oyun terimleri, oyunlarla ilgili kavramlar ve cümle bağlamındaki kelimeleri açıkla
- Küfür, argo veya uygunsuz içerikleri açıklama
- Kullanıcı uygunsuz bir kelime seçerse kibarca reddet: "Bu terimi açıklayamam"
- Her zaman profesyonel ve eğitici dil kullan
- Türkçe cevap ver
- Maksimum 2-3 cümle kullan

Sadece oyunlarla ilgili terimleri açıkla."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Kelime/Terim: '{request.word}'\n\nCümle bağlamı: {request.context}\n\nBu kelime/terimi açıkla:"
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return WordExplainResponse(explanation=response)
    except Exception as e:
        logger.error(f"Word explain error: {str(e)}")
        raise HTTPException(status_code=500, detail="Word explanation failed")

# Categories
@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            "Aksiyon",
            "RPG",
            "Strateji",
            "Macera",
            "Korku",
            "Simülasyon",
            "Spor",
            "Yarış",
            "Bulmaca",
            "FPS",
            "MOBA",
            "Battle Royale",
            "Platform",
            "Metroidvania",
            "Rogue-like",
            "Sandbox",
            "Survival",
            "Indie",
            "MMORPG",
            "Fighting",
            "Rhythm",
            "Visual Novel",
            "Diğer"
        ]
    }

# Search
@api_router.get("/search")
async def search(q: str, skip: int = 0, limit: int = 20):
    if not q or len(q.strip()) < 2:
        return {"reviews": [], "users": []}
    
    query_lower = q.lower().strip()
    
    # Search reviews by title or game name
    reviews = await db.reviews.find(
        {
            "$or": [
                {"title": {"$regex": query_lower, "$options": "i"}},
                {"game_name": {"$regex": query_lower, "$options": "i"}},
                {"author_username": {"$regex": query_lower, "$options": "i"}}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
        if isinstance(review.get('updated_at'), str):
            review['updated_at'] = datetime.fromisoformat(review['updated_at'])
    
    # Search users by username
    users = await db.users.find(
        {"username": {"$regex": query_lower, "$options": "i"}},
        {"_id": 0, "password": 0}
    ).limit(10).to_list(10)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return {"reviews": reviews, "users": users}

# Popular games
@api_router.get("/popular-games")
async def get_popular_games(limit: int = 3):
    # Aggregate reviews by game_name and calculate popularity score
    pipeline = [
        {
            "$group": {
                "_id": "$game_name",
                "review_count": {"$sum": 1},
                "total_likes": {"$sum": "$likes_count"},
                "avg_rating": {"$avg": "$rating"},
                "cover_image": {"$first": "$cover_image"}
            }
        },
        {
            "$addFields": {
                "popularity_score": {
                    "$add": [
                        {"$multiply": ["$review_count", 10]},
                        {"$multiply": ["$total_likes", 5]},
                        {"$multiply": [{"$ifNull": ["$avg_rating", 0]}, 2]}
                    ]
                }
            }
        },
        {"$sort": {"popularity_score": -1}},
        {"$limit": limit}
    ]
    
    popular_games = await db.reviews.aggregate(pipeline).to_list(limit)
    
    return {
        "popular_games": [
            {
                "game_name": game["_id"],
                "review_count": game["review_count"],
                "total_likes": game["total_likes"],
                "avg_rating": round(game.get("avg_rating", 0), 1) if game.get("avg_rating") else None,
                "cover_image": game.get("cover_image"),
                "popularity_score": round(game["popularity_score"], 1)
            }
            for game in popular_games
        ]
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()