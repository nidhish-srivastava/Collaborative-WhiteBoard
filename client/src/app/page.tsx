'use client'

import { FC, useEffect, useState } from 'react'
import { useDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'

import { io } from 'socket.io-client'
const socket = io('http://localhost:3001')
import { drawLine } from '../utils/drawLine'

interface pageProps {}

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

const page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>('#000')
  const [togglePicker,setTogglePicker] = useState(false)
  const { canvasRef, onMouseDown, clear } = useDraw(createLine)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      console.log('sending canvas state')
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('I received the state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return console.log('no ctx here')
      drawLine({ prevPoint, currentPoint, ctx, color })
    })

    socket.on('clear', clear)

    return () => {
      socket.off('draw-line')
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('clear')
    }
  }, [canvasRef])

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', { prevPoint, currentPoint, color })
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  return (
    <>
    <div className='w-screen h-screen bg-white flex justify-center items-center'>
         <button type='button' className={`bg-blue-600 rounded-xl bottom-10 right-4 w-fit p-4`}>
      {color}
      </button>
      <div className='flex flex-col gap-10 top-10 absolute left-8'>
        <button
          type='button'
          className='p-2 rounded-md border-none bg-green-500  text-white'
          onClick={() => socket.emit('clear')}>
          Clear canvas
        </button>

        {/* {
          togglePicker ? 
          <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
          : null
        }
        <div>
        {
          togglePicker ? <button  type='button'
          className='p-2 rounded-md border-none bg-green-500  text-white' onClick={()=>setTogglePicker(false)}>Close</button>
          :
          <button  type='button'
          className='p-2 rounded-md border-none bg-green-500  text-white' onClick={()=>setTogglePicker(true)}>Color Picker</button>
          }
        </div> */}

<div className="relative">
        <button
          type="button"
          className="p-2 rounded-md border-none bg-green-500 text-white"
          onClick={() => setTogglePicker(!togglePicker)}
          >
          Color Picker
        </button>

        {togglePicker && (
          <div className="absolute top-0 left-0 z-10">
            <div
              className="fixed inset-0"
              onClick={() => setTogglePicker(false)}
              />
            <div className="flex flex-col items-center gap-4 p-4 rounded-lg shadow-lg bg-slate-200">
              <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
              <button
                type="button"
                className="p-2 cursor-pointer rounded-md border-none bg-green-500 text-white"
                onClick={() => setTogglePicker(false)}
                >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
   
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        width={1200}
        height={650}
        className='border border-black rounded-md'
      />
    </div>
        </>
  )
}

export default page

