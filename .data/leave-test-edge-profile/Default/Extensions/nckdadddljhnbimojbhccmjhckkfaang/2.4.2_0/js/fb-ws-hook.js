'use strict';

((window) => {
  // Minimal MQTT packet parser/generator (browser-native, no dependencies)
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();

  const CMD_NAMES = [
    null, 'connect', 'connack', 'publish', 'puback',
    'pubrec', 'pubrel', 'pubcomp', 'subscribe', 'suback',
    'unsubscribe', 'unsuback', 'pingreq', 'pingresp', 'disconnect', 'auth'
  ];

  function decodeRemainingLength(data, startIndex) {
    let value = 0, multiplier = 1, index = startIndex, byte;
    do {
      if (index >= data.length) throw new Error('Incomplete remaining length');
      byte = data[index++];
      value += (byte & 0x7F) * multiplier;
      multiplier *= 128;
    } while (byte & 0x80);
    return { value, bytesRead: index - startIndex };
  }

  function encodeRemainingLength(length) {
    const bytes = [];
    do {
      let byte = length % 128;
      length = Math.floor(length / 128);
      if (length > 0) byte |= 0x80;
      bytes.push(byte);
    } while (length > 0);
    return bytes;
  }

  function parser(opts) {
    const listeners = { packet: [], error: [] };

    return {
      on(event, fn) {
        if (listeners[event]) listeners[event].push(fn);
      },
      parse(data) {
        let pos = 0;
        while (pos < data.length) {
          let packet, headerSize, remainingLength;
          try {
            const byte0 = data[pos];
            const typeNum = (byte0 >> 4) & 0x0F;
            const cmd = CMD_NAMES[typeNum];

            const rl = decodeRemainingLength(data, pos + 1);
            headerSize = 1 + rl.bytesRead;
            remainingLength = rl.value;

            if (pos + headerSize + remainingLength > data.length) {
              throw new Error('Incomplete packet');
            }

            packet = { cmd };
            let offset = pos + headerSize;

            if (typeNum === 3) { // PUBLISH
              packet.qos = (byte0 >> 1) & 0x03;
              packet.dup = !!(byte0 & 0x08);
              packet.retain = !!(byte0 & 0x01);

              // Topic: 2-byte length prefix + UTF-8 string
              const topicLen = (data[offset] << 8) | data[offset + 1];
              offset += 2;
              packet.topic = textDecoder.decode(data.subarray(offset, offset + topicLen));
              offset += topicLen;

              // Message ID: only if QoS > 0
              if (packet.qos > 0) {
                packet.messageId = (data[offset] << 8) | data[offset + 1];
                offset += 2;
              }

              // Payload: remaining bytes
              packet.payload = data.slice(offset, pos + headerSize + remainingLength);
            }
          } catch (err) {
            listeners.error.forEach(fn => fn(err));
            return;
          }

          // Call packet listeners outside try/catch so application errors
          // (e.g. WebSocket CLOSED) don't get caught as parse errors
          listeners.packet.forEach(fn => fn(packet));
          pos += headerSize + remainingLength;
        }
      }
    };
  }

  function generate(packet, opts) {
    const qos = packet.qos || 0;
    const topicBytes = textEncoder.encode(packet.topic);

    let payloadBytes;
    if (packet.payload instanceof Uint8Array) {
      payloadBytes = packet.payload;
    } else if (typeof packet.payload === 'string') {
      payloadBytes = textEncoder.encode(packet.payload);
    } else {
      payloadBytes = new Uint8Array(0);
    }

    const hasMessageId = qos > 0;
    const remainingLength = 2 + topicBytes.length + (hasMessageId ? 2 : 0) + payloadBytes.length;
    const rlBytes = encodeRemainingLength(remainingLength);

    const byte0 = (3 << 4) |
      ((packet.dup ? 1 : 0) << 3) |
      ((qos & 0x03) << 1) |
      (packet.retain ? 1 : 0);

    const totalSize = 1 + rlBytes.length + remainingLength;
    const buffer = new Uint8Array(totalSize);
    let pos = 0;

    buffer[pos++] = byte0;
    for (let j = 0; j < rlBytes.length; j++) buffer[pos++] = rlBytes[j];

    // Topic length (big-endian) + topic string
    buffer[pos++] = (topicBytes.length >> 8) & 0xFF;
    buffer[pos++] = topicBytes.length & 0xFF;
    buffer.set(topicBytes, pos);
    pos += topicBytes.length;

    // Message ID (if QoS > 0)
    if (hasMessageId) {
      buffer[pos++] = (packet.messageId >> 8) & 0xFF;
      buffer[pos++] = packet.messageId & 0xFF;
    }

    // Payload
    buffer.set(payloadBytes, pos);

    return buffer.buffer;
  }

  // main
  const settings = {
    block_seen_chat: true,
    block_typing_chat: true
  };

  // handle message from extension
  window.addEventListener('message', (event) => {
    const data = event.data;

    if (
      event.isTrusted &&
      event.origin.includes('.facebook.com') &&
      data.sender === 'j2team_security' &&
      data.cmd === 'sync_settings_response'
    ) {
      const options = data.data;

      if ('block_seen_chat' in options) {
        settings.block_seen_chat = options.block_seen_chat;
      }

      if ('block_typing_chat' in options) {
        settings.block_typing_chat = options.block_typing_chat;
      }
    }
  });

  // sync settings from extension
  window.postMessage({
    cmd: 'sync_settings',
    sender: 'facebook_content_script'
  });

  function getUserID() {
    try {
      return document.cookie.match(/c_user=([0-9]+)/)[1];
    } catch (e) {
      return null;
    }
  }

  function safeParse(e) {
    if (!e) return null;
    try {
      var t = JSON.parse(e);
      if (t) return t
    } catch (e) {
      return debug, null
    }
    return null
  }

  const ignoreTopic = ['/send_additional_contacts', '/br_sr', '/sr_res', '/ls_app_settings'];
  const ignoreCmd = ['pingreq', 'subscribe'];
  const c_user = getUserID();
  const opts = {protocolVersion: 3};
  let qq = [];

    function getCurrentTimestamp() {
      return Date.now() * 1000;
    }

  const wsProxy = new Proxy(window.WebSocket, {
    construct: function(target, args) {
      const instance = new target(...args),
        openHandler = e => {},
        messageHandler = e => {
          e = new Uint8Array(e.data);
          let t = parser(opts);

          // mes_block_delivery
          if (2e3 < e.length) {
            t.on('packet', e => {
              'publish' === e.cmd && '/ls_resp' === e.topic && 1 === e.qos && qq.push(e.messageId)
            });
            try {
              t.parse(e);
            } catch (err) {
              // Ignore parse error
            }
          }
        },
        closeHandler = e => {
          instance.removeEventListener('open', openHandler)
          instance.removeEventListener('close', closeHandler)
          instance.removeEventListener('message', messageHandler)
        };
      instance.addEventListener('message', messageHandler)
      instance.addEventListener('open', openHandler)
      instance.addEventListener('close', closeHandler)

      instance.send = new Proxy(instance.send, {
        apply: function(target, thisArg, args) {
          const e = new Uint8Array(args[0]);
          let t = parser(opts);

          function send() {
            if (instance.readyState === WebSocket.OPEN) {
              target.apply(thisArg, args);
            }
          }

          t.on('packet', i => {
            let rPayload;
            try {
              if (ignoreTopic.includes(i.topic) || ignoreCmd.includes(i.cmd)) {
                return send();
              }

              // if ("puback" === i.cmd) {
              //   // mes_block_delivery
              //   if (qq.includes(i.messageId)) return;
              //   send()
              // }

              if (i.payload && '/ls_req' === i.topic) {
                let a = safeParse(textDecoder.decode(i.payload));

                // block typing
                if (settings.block_typing_chat && a && 4 === a.type) {
                  // console.log('[J2] [Typing] raw payload:', a);
                  const e = safeParse(a.payload);
                  if (e || send(), rPayload = safeParse(e.payload), rPayload && rPayload.thread_key) {
                    // console.log('[J2] [Typing] blocked', rPayload.thread_key);
                    return
                  }
                }

                // settings.mes_block_active_online
                // if (a && 4 === a.type) {
                //   let e = safeParse(a.payload);

                //   if (e && "1" === e.label && '{"app_state":1}' === e.payload) {
                //     e.payload = '{"app_state":0}'
                //     a.payload = JSON.stringify(e)
                //     i.payload = textEncoder.encode(JSON.stringify(a))
                //     args[0] = generate(i, opts)
                //     return send()
                //   }
                // }

                // block seen
                if (settings.block_seen_chat && a && 3 === a.type) {
                  // console.log('[J2] [Seen] raw payload:', a);
                  let s = safeParse(a.payload);

                  if (s && s.tasks && 1 <= s.tasks.length) {
                    let t = !1;

                    for (let e = 0; e < s.tasks.length; e++) {
                      if ('21' === s.tasks[e].label) {
                        t = !0
                        s.tasks[e].payload = JSON.stringify({
                          thread_id: c_user.toString(),
                          last_read_watermark_ts: getCurrentTimestamp()
                        });
                      }
                    }

                    if (t) {
                      // console.log('[J2] [Seen] blocked');
                      a.payload = JSON.stringify(s)
                      i.payload = textEncoder.encode(JSON.stringify(a))
                      args[0] = generate(i, opts)
                      return send()
                    }

                    return send()
                  }
                }
              }

              send()
            } catch (e) {
              send()
            }
          })

          t.on('error', e => {
            send()
          })

          t.parse(e)
        }
      })

      return instance
    }
  });

  window.WebSocket = wsProxy;
})(window);
