
import { useEffect, useState } from 'react'
import './App.css'
import Admin from './Admin'
import { supabase } from './supabase'

function PublicHome() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="website">

      <header className="navbar">
        <a className="brand" href="/">
          AG<span>PICKS.</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#reviews">Reviews</a>
          <a href="https://instagram.com/" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div>
          <p>WELCOME TO AG PICKS</p>
          <h1>Discover your next favourite.</h1>
          <p>
            Find amazing products at exciting prices.
            Your next favourite deal starts here.
          </p>
          <a href="#products">Explore Products</a>
        </div>
      </section>

      <section className="products-section" id="products">
        <div>
          <p>OUR COLLECTION</p>
          <h2>Find Your Picks.</h2>
          <span>{filteredProducts.length} PRODUCTS</span>
        </div>

        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <article className="product-card" key={product.id}>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="product-image"
                  />
                )}

                <div className="product-info">
                  <h3>{product.name}</h3>

                  {product.description && (
                    <p>{product.description}</p>
                  )}

                  <div className="product-prices">
                    {product.original_price && (
                      <span className="original-price">
                        ₹{Number(product.original_price).toLocaleString('en-IN')}
                      </span>
                    )}

                    <strong className="offer-price">
                      ₹{Number(product.offer_price).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <a
                    className="buy-button"
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                  >
                    BUY NOW
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="reviews-section" id="reviews">
        <p>YOUR OPINION MATTERS</p>
        <h2>Customer Reviews</h2>
        <p>Customer reviews coming soon.</p>
      </section>

      <section className="instagram-section">
        <h2>Stay Connected.</h2>
        <p>Follow AG PICKS on Instagram.</p>
        <a href="https://instagram.com/" target="_blank" rel="noreferrer">
          Follow Instagram
        </a>
      </section>

      <footer className="footer">
        <a className="brand" href="/">
          AG<span>PICKS.</span>
        </a>
        <p>© 2026 AG PICKS. All rights reserved.</p>
      </footer>

    </div>
  )
}

function App() {
  if (window.location.pathname === '/admin') {
    return <Admin />
  }

  return <PublicHome />
}

export default App
