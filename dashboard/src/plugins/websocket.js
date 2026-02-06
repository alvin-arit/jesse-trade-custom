import WebSocketAsPromised from 'websocket-as-promised'
import socketActions from '@/plugins/socketActions'

import { useMainStore } from '@/stores/main'

// Decompress gzip data from base64 string
async function decompressData (base64Data) {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Use DecompressionStream API (modern browsers)
    const ds = new DecompressionStream('gzip')
    const decompressedStream = new Response(bytes).body.pipeThrough(ds)
    const decompressedData = await new Response(decompressedStream).text()
    return JSON.parse(decompressedData)
  } catch (error) {
    console.error('Failed to decompress data:', error)
    return null
  }
}

export default {
  install: (app, settings) => {
    const mainStore = useMainStore()

    const loginWatchInterval = setInterval(function () {
      if (mainStore.isAuthenticated) {
        let url = settings.socketPath
        if (window.Cypress) {
          url = 'ws://127.0.0.1:8001/ws'
        }

        const wsp = new WebSocketAsPromised(`${url}?token=${sessionStorage.auth_key}`, {
          packMessage: data => JSON.stringify(data),
          unpackMessage: data => JSON.parse(data),
          attachRequestId: (data, requestId) => Object.assign({ id: requestId }, data),
          extractRequestId: data => data && data.id
        })

        let openIntervalId = null
        let reopenAttempts = 3

        function wsOpen () {
          wsp.open()
            .then(async () => {
              mainStore.isConnected = true

              if (openIntervalId) {
                clearInterval(openIntervalId)
              }

              if (reopenAttempts < 3) {
                app.notyf.success('WebSocket reconnected')
              }

              // Reset reopen attempts after ws reopened
              reopenAttempts = 3
            })
            .catch(error => {
              console.error('Socket encountered error.', error)

              if (process.env.VUE_APP_IS_DEBUG === 'yes') {
                app.notyf.error(error.message)
              }
            })
        }



        wsp.onClose.addListener(async () => {
          console.log('Connection closed.')

          mainStore.isConnected = false
          if (openIntervalId) clearInterval(openIntervalId)

          if (reopenAttempts > 0) {
            // Trying to re-open web-socket after close
            openIntervalId = setInterval(() => {
              console.log('Trying to re-open web-socket')
              reopenAttempts--
              wsOpen()
            }, 3000)
          } else {
            console.log('Socket can\'t re-establish connection!')
          }
        })

        // Listen ws events and pass data to Pinia's actions
        wsp.onUnpackedMessage.addListener(async message => {
          const event = message.event
          let data = message.data
          const id = message.id
          const actions = socketActions().get(event)

          // Decompress data if it's compressed
          if (message.is_compressed && typeof data === 'string') {
            data = await decompressData(data)
            if (data === null) {
              console.error('Failed to decompress message for event:', event)
              return
            }
          }

          // console.log(event, id, data)

          if (actions !== undefined) {
            actions.forEach(action => {
              action(id, data)
            })
          }
        })

        app.config.globalProperties.$wsp = wsp
        app.wsp = app.config.globalProperties.$wsp
        wsOpen()
        clearInterval(loginWatchInterval)
      }
    }, 1000)
  }
}
