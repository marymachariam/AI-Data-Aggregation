import re
from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    company_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 10:
            raise ValueError("Password must be at least 10 characters.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain a lowercase letter.")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain a digit.")
        return value


class UserOut(BaseModel):
    id: str
    email: str
    company_name: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"