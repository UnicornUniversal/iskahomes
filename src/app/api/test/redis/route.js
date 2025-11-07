import { NextResponse } from 'next/server'
import { setKey, getKey, connectRedis, isRedisConnected } from '@/lib/redis'

export async function POST(request) {
  try {
    const { key, value, operation } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    if (operation === 'set' && !value) {
      return NextResponse.json(
        { error: 'Value is required for SET operation' },
        { status: 400 }
      )
    }

    // Ensure Redis is connected
    if (!isRedisConnected()) {
      try {
        await connectRedis()
      } catch (connectError) {
        return NextResponse.json(
          { 
            error: 'Failed to connect to Redis',
            details: connectError.message,
            redisConnected: false
          },
          { status: 500 }
        )
      }
    }

    let result = {}

    if (operation === 'set') {
      // Set the key-value pair
      await setKey(key, value)
      result = {
        operation: 'set',
        key,
        value,
        success: true,
        timestamp: new Date().toISOString(),
        redisConnected: isRedisConnected()
      }
    } else if (operation === 'get') {
      // Get the value
      const retrievedValue = await getKey(key)
      result = {
        operation: 'get',
        key,
        value: retrievedValue,
        success: true,
        timestamp: new Date().toISOString(),
        redisConnected: isRedisConnected()
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Use "set" or "get"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Redis ${operation.toUpperCase()} operation completed successfully`,
      data: result
    })

  } catch (error) {
    console.error('Redis test error:', error)
    return NextResponse.json(
      { 
        error: 'Redis test failed',
        details: error.message,
        redisConnected: isRedisConnected()
      },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Test Redis connection and basic operations
    if (!isRedisConnected()) {
      try {
        await connectRedis()
      } catch (connectError) {
        return NextResponse.json(
          { 
            error: 'Failed to connect to Redis',
            details: connectError.message,
            redisConnected: false
          },
          { status: 500 }
        )
      }
    }

    const testKey = 'redis-test-connection'
    const testValue = {
      message: 'Redis connection test',
      timestamp: new Date().toISOString(),
      random: Math.random()
    }

    // Set test data
    await setKey(testKey, testValue)

    // Get test data
    const retrievedValue = await getKey(testKey)

    return NextResponse.json({
      success: true,
      message: 'Redis connection test successful',
      data: {
        redisConnected: isRedisConnected(),
        testKey,
        testValue,
        retrievedValue,
        verification: JSON.stringify(retrievedValue) === JSON.stringify(testValue)
      }
    })

  } catch (error) {
    console.error('Redis connection test error:', error)
    return NextResponse.json(
      { 
        error: 'Redis connection test failed',
        details: error.message,
        redisConnected: isRedisConnected()
      },
      { status: 500 }
    )
  }
}
