export const saveToStorage = (key, data, local = true) => {
  try {
    if (!isStorageAvailable(local)) return false

    if (local) localStorage?.setItem(key, data);
    else sessionStorage?.setItem(key, data);

  } catch (e) {
    console.error(`Error: save data to ${local ? 'local' : 'session'} storage: ${e}`)
  }
}

export const loadFromStorage = (key, local = true) => {
  try {
    if (!isStorageAvailable(local)) return null
    const data = local ? localStorage?.getItem(key) : sessionStorage?.getItem(key)
    return data
        ? local
            ? data
            : JSON.parse(data)
        : null
  } catch (e) {
    console.error(`Error: load data from ${local ? 'local' : 'session'} storage: ${e}`)
    return null
  }
}

export const removeFromStorage = (key, local = true) => {
  try {
    if (!isStorageAvailable(local)) return false

    if (local) localStorage?.removeItem(key);
    else sessionStorage?.removeItem(key);
    
  } catch (e) {
    console.error(`Error: delete data from ${local ? 'local' : 'session'} storage: ${e}`)
  }
}

const isStorageAvailable = (local) => {
    const storage = local ? localStorage : sessionStorage
    return (
        typeof storage === 'object' &&
        storage !== null &&
        typeof storage.getItem === 'function' &&
        typeof storage.setItem === 'function' &&
        typeof storage.removeItem === 'function'
    )
}