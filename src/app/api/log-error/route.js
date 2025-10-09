export async function POST(request) {
  try {
    const body = await request.json()
    console.log('=== STORAGE UPLOAD ERROR ===')
    console.log('Type:', body.type)
    console.log('Error:', body.error)
    console.log('File Path:', body.filePath)
    console.log('File Name:', body.fileName)
    console.log('File Size:', body.fileSize)
    console.log('File Type:', body.fileType)
    console.log('=============================')
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error logging failed:', error)
    return new Response(JSON.stringify({ error: 'Logging failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
