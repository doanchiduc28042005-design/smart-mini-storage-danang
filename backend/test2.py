import asyncio, httpx
async def test():
  async with httpx.AsyncClient() as client:
    resp = await client.post('http://localhost:8000/api/shippers/login', json={'shipper_code': 'SP0001', 'password': 'password123'})
    print(resp.status_code)
    print(resp.json())
asyncio.run(test())
