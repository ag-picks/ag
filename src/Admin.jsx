
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [available, setAvailable] = useState(true)
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) checkAdmin()
  }, [session])

  async function checkAdmin() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error || !data) {
      await supabase.auth.signOut()
      setSession(null)
      setMessage('Admin access illa. Check your admin account.')
      return
    }

    loadProducts()
  }

  async function login(e) {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) setMessage(error.message)
  }

  async function logout() {
    await supabase.auth.signOut()
    setProducts([])
    setMessage('')
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    else setProducts(data || [])
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setOriginalPrice('')
    setOfferPrice('')
    setAffiliateUrl('')
    setAvailable(true)
    setImage(null)
  }

  function editProduct(product) {
    setEditingId(product.id)
    setName(product.name || '')
    setDescription(product.description || '')
    setOriginalPrice(product.original_price || '')
    setOfferPrice(product.offer_price || '')
    setAffiliateUrl(product.affiliate_url || '')
    setAvailable(product.is_available ?? true)
    setImage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveProduct(e) {
    e.preventDefault()
    if (!name.trim() || !offerPrice || !affiliateUrl.trim()) {
      setMessage('Name, offer price and affiliate link required.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      let imageUrl = null

      if (editingId) {
        imageUrl = products.find(p => p.id === editingId)?.image_url || null
      }

      if (image) {
        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image, { upsert: false })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        imageUrl = data.publicUrl
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        original_price: originalPrice ? Number(originalPrice) : null,
        offer_price: Number(offerPrice),
        affiliate_url: affiliateUrl.trim(),
        image_url: imageUrl,
        is_available: available
      }

      let result

      if (editingId) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('products')
          .insert(productData)
      }

      if (result.error) throw result.error

      setMessage(editingId ? 'Product updated!' : 'Product published!')
      resetForm()
      await loadProducts()
    } catch (error) {
      setMessage(error.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) setMessage(error.message)
    else {
      setMessage('Product deleted.')
      loadProducts()
    }
  }

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>

  if (!session) {
    return (
      <main style={styles.page}>
        <form onSubmit={login} style={styles.login}>
          <h1>AG PICKS</h1>
          <p>Admin Login</p>
          <input
            style={styles.input}
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Login</button>
          {message && <p>{message}</p>}
        </form>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1>AG PICKS — Admin</h1>
        <button style={styles.logout} onClick={logout}>Logout</button>
      </header>

      <form onSubmit={saveProduct} style={styles.form}>
        <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

        <input style={styles.input} placeholder="Product name"
          value={name} onChange={e => setName(e.target.value)} required />

        <textarea style={styles.input} placeholder="Description"
          value={description} onChange={e => setDescription(e.target.value)} />

        <input style={styles.input} type="number" placeholder="Original price (₹)"
          value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} />

        <input style={styles.input} type="number" placeholder="Offer price (₹)"
          value={offerPrice} onChange={e => setOfferPrice(e.target.value)} required />

        <input style={styles.input} type="url" placeholder="Affiliate URL"
          value={affiliateUrl} onChange={e => setAffiliateUrl(e.target.value)} required />

        <label>Product image</label>
        <input style={styles.input} type="file" accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)} />

        <label>
          <input type="checkbox" checked={available}
            onChange={e => setAvailable(e.target.checked)} />
          {' '}Available
        </label>

        <button style={styles.button} disabled={saving} type="submit">
          {saving ? 'Saving...' : editingId ? 'Update Product' : 'Publish Product'}
        </button>

        {editingId && (
          <button style={styles.cancel} type="button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}

        {message && <p>{message}</p>}
      </form>

      <section style={styles.form}>
        <h2>Products ({products.length})</h2>
        {products.map(product => (
          <article key={product.id} style={styles.product}>
            <div>
              <strong>{product.name}</strong>
              <p>₹{product.offer_price}</p>
            </div>
            <button style={styles.small} onClick={() => editProduct(product)}>Edit</button>
            <button style={styles.delete} onClick={() => deleteProduct(product.id)}>Delete</button>
          </article>
        ))}
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6fa',
    padding: '24px',
    color: '#171923',
    fontFamily: 'Arial, sans-serif'
  },
  login: {
    maxWidth: '380px',
    margin: '70px auto',
    padding: '28px',
    background: 'white',
    borderRadius: '18px',
    display: 'grid',
    gap: '14px',
    boxShadow: '0 8px 30px #00000010'
  },
  header: {
    maxWidth: '850px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  },
  form: {
    maxWidth: '850px',
    margin: '20px auto',
    padding: '24px',
    background: 'white',
    borderRadius: '18px',
    display: 'grid',
    gap: '14px',
    boxShadow: '0 8px 30px #00000010'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px'
  },
  button: {
    padding: '14px',
    border: 0,
    borderRadius: '10px',
    background: '#171923',
    color: 'white',
    cursor: 'pointer'
  },
  logout: {
    padding: '10px 16px',
    border: 0,
    borderRadius: '9px',
    background: '#222',
    color: 'white'
  },
  cancel: {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '9px',
    background: 'white'
  },
  product: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 0',
    borderBottom: '1px solid #eee'
  },
  small: {
    padding: '9px 14px',
    border: 0,
    borderRadius: '8px',
    background: '#e8efff'
  },
  delete: {
    padding: '9px 14px',
    border: 0,
    borderRadius: '8px',
    background: '#ffe8e8',
    color: '#a00'
  }
}
