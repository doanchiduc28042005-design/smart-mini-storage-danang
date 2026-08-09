from fastapi import FastAPI, APIRouter
app = FastAPI()
router = APIRouter()
@router.get("/")
@router.head("/")
def root():
    return {"msg": "ok"}
app.include_router(router)
print("Success")
