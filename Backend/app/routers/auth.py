import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schemas import UserRegister, UserOut, Token
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    users = UserRepository(db)

    if users.get_by_email(payload.email) is not None:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = users.create(
        User(
            id=str(uuid.uuid4()),
            email=payload.email,
            hashed_password=hash_password(payload.password),
            company_name=payload.company_name,
        )
    )
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    users = UserRepository(db)
    user = users.get_by_email(form_data.username)  # OAuth2 form calls it "username"

    # Same error for wrong email vs wrong password — don't leak which one was wrong.
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user