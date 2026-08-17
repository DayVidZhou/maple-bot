import { useEffect, useState } from 'react'
import { defaultRegistryName } from '../types/registry'

export function useRegistryNameInput(
  type: 'routine' | 'hotkey' | 'minimap',
  listLength: number,
) {
  const [name, setName] = useState(() => defaultRegistryName(type, listLength))

  useEffect(() => {
    setName(defaultRegistryName(type, listLength))
  }, [type, listLength])

  const resolveName = () => name.trim() || defaultRegistryName(type, listLength)

  return {
    name,
    setName,
    resolveName,
  }
}
