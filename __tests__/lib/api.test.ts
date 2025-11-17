import { api } from '../../app/lib/api'

// Mock fetch
global.fetch = jest.fn()

// Ensure window is defined for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(localStorage.getItem as jest.Mock).mockReturnValue(null)
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Token Management', () => {
    it('should set token in localStorage', () => {
      api.setToken('test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
    })

    it('should remove token from localStorage when set to null', () => {
      api.setToken(null)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('API Methods', () => {
    it('should make GET request', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      const result = await api.get('/test')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' }),
      )
      expect(result).toEqual({ id: 1 })
    })

    it('should make POST request', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      const result = await api.post('/test', { name: 'test' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      )
    })

    it('should make PATCH request', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      await api.patch('/test/1', { name: 'updated' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'updated' }),
        }),
      )
    })

    it('should make DELETE request', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await api.delete('/test/1')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('should add Authorization header when token exists', async () => {
      api.setToken('test-token')
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await api.get('/test')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })

    it('should throw error when request fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      })

      await expect(api.get('/test')).rejects.toThrow('Not found')
    })
  })
})

