import { useCallback, useEffect, useRef } from "react"

export const useMountedState = () => {
   const mountedRef = useRef(false)
   const isMounted = useCallback(() => mountedRef.current, [])

   useEffect(() => {
      mountedRef.current = true

      return () => {
         mountedRef.current = false
      }
   }, [])

   return isMounted;
}