const cache = new Map();

const setCache = (key, value, ttl) => {
  const data = {
    value,
    expire: ttl ? Date.now() + ttl * 1000 : null,
  };

  cache.set(key, data);
  // fucntion run only have ttl
  if (ttl) {
    setTimeout(() => {
      cache.delete(key);
    }, ttl * 1000);
  }
};

const getCache = (key) => {
  const data = cache.get(key);
  if (!data) return null;

  if (data.expire && Date.now() > data.expire) {
    cache.delete(key);
    return null;
  }

  return data.value;
};

module.exports = { setCache, getCache };
