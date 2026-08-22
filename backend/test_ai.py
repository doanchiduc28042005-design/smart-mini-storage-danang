import asyncio
import os
from litellm import acompletion
from dotenv import load_dotenv

load_dotenv()
os.environ['GROQ_API_KEY'] = 'dummy'
async def main():
    try:
        model = 'groq/openai/gpt-oss-120b'
        print(f'Testing model: {model}')
        res = await acompletion(model=model, messages=[{'role': 'user', 'content': 'hi'}])
        print(res)
    except Exception as e:
        print(f'Error type: {type(e).__name__}')
        print(f'Error msg: {e}')

asyncio.run(main())
