const { Writable } = require('stream')
const { pipeline } = require('stream/promises')
const { Hash } = require('@aws-sdk/hash-node')
const { HttpRequest } = require('@aws-sdk/protocol-http')
const { S3RequestPresigner } = require('@aws-sdk/s3-request-presigner')
const { createReadStream } = require('fs')
const { putStream } = require('@logi.one/rest-client')

const bucketName = 'YOUR BUCKET NAME'
const accessKeyId = 'YOUR ACCESS KEY'
const secretAccessKey = 'YOUR SECRET ACCESS KEY'
const hostname = 'sos-ch-gva-2.exo.io'
const region = 'ch-gva-2'
const fileName = 'MY_FILE.txt'

async function createPresignedUrl(key) {
    const presigner = new S3RequestPresigner({
      credentials: { accessKeyId, secretAccessKey },
      region,
      sha256: Hash.bind(null, "sha256"),
    })
  
    const { query } = await presigner.presign(
      new HttpRequest({ 
            hostname,
            protocol: 'https:',
            path: `${bucketName}/${key}`,
            query: undefined,
            method: 'PUT'
      })
    )
    const queries = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
    return `https://${hostname}/${bucketName}/${key}?${queries}`
}


async function main() {
    const url = await createPresignedUrl(fileName)
    const stream = createReadStream(fileName)
    try {
        await putStream(url, stream)
        console.log('File uploaded with success !')
    } catch (err) {
        let response = '';
        const stream = new Writable({
            write: (data, _encoding, next) => {
                response += data
                next()
            }
        })
        await pipeline(err.response, stream)

        console.error(`Error: ${err?.status} ${err?.message}\n${response}`)
    }
}

main()
