(function () {
  const state = {
    cart: null,
  };

  function moneyFormat(amountInCents) {
    const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format((amountInCents || 0) / 100);
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  async function fetchCart() {
    const response = await fetch('/cart.js');
    if (!response.ok) {
      throw new Error('Unable to load cart.');
    }
    state.cart = await response.json();
    return state.cart;
  }

  function cartLineMarkup(item) {
    const imageMarkup = item.image
      ? `<img src="${item.image}" alt="${item.product_title}">`
      : '<div class="typsh-commerce-empty">No image</div>';

    return `
      <article class="typsh-cart-line" data-cart-line-key="${item.key}">
        <a class="typsh-cart__image" href="${item.url}">${imageMarkup}</a>
        <div class="typsh-cart-line__meta">
          <div class="typsh-commerce-grid" style="gap:6px;">
            <a class="typsh-cart-line__title" href="${item.url}">${item.product_title}</a>
            <p class="typsh-commerce-meta-text">${item.variant_title || 'Default option'}</p>
            <p class="typsh-commerce-meta-text">${moneyFormat(item.final_line_price)}</p>
          </div>
          <div class="typsh-commerce-cart__row">
            <div class="typsh-commerce-qty">
              <button type="button" class="typsh-commerce-pill" data-cart-qty-change data-line-key="${item.key}" data-quantity="${Math.max(0, item.quantity - 1)}" aria-label="Decrease quantity">-</button>
              <span>${item.quantity}</span>
              <button type="button" class="typsh-commerce-pill" data-cart-qty-change data-line-key="${item.key}" data-quantity="${item.quantity + 1}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="typsh-commerce-link-button" data-cart-remove data-line-key="${item.key}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCart(cart) {
    qsa('[data-cart-count]').forEach((node) => {
      node.textContent = cart.item_count > 0 ? `(${cart.item_count})` : '';
    });

    const drawerItems = qs('[data-typsh-cart-items]');
    const drawerSubtotal = qs('[data-typsh-cart-subtotal]');
    const empty = qs('[data-typsh-cart-empty]');

    if (!drawerItems || !drawerSubtotal || !empty) {
      return;
    }

    drawerSubtotal.textContent = moneyFormat(cart.total_price);

    if (cart.items.length === 0) {
      drawerItems.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    drawerItems.innerHTML = cart.items.map(cartLineMarkup).join('');
  }

  function openDrawer() {
    const drawer = qs('[data-typsh-cart-drawer]');
    if (!drawer) {
      return;
    }
    drawer.hidden = false;
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const drawer = qs('[data-typsh-cart-drawer]');
    if (!drawer) {
      return;
    }
    drawer.classList.remove('is-open');
    drawer.hidden = true;
    document.body.style.overflow = '';
  }

  async function updateCartQuantity(key, quantity) {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: key,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error('Unable to update cart.');
    }

    const cart = await response.json();
    state.cart = cart;
    renderCart(cart);
    return cart;
  }

  async function addToCart(form) {
    const statusNode = qs('[data-quick-add-status]', form.closest('[data-typsh-product-root], [data-typsh-product-card]'));
    if (statusNode) {
      statusNode.textContent = 'Adding to cart...';
      statusNode.dataset.state = '';
    }

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      body: new FormData(form),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.description || 'Unable to add this item.';
      if (statusNode) {
        statusNode.textContent = message;
        statusNode.dataset.state = 'error';
      }
      throw new Error(message);
    }

    if (statusNode) {
      statusNode.textContent = 'Added to cart';
      statusNode.dataset.state = 'success';
    }

    const cart = await fetchCart();
    renderCart(cart);
    openDrawer();
    window.dispatchEvent(new CustomEvent('typsh:cart-updated', { detail: cart }));
  }

  function matchingVariant(variants, selectedOptions) {
    return variants.find((variant) =>
      variant.options.every((option, index) => option === selectedOptions[index])
    );
  }

  function updateProductRoot(root) {
    const variantsNode = qs('[data-typsh-variants]', root);
    if (!variantsNode) {
      return;
    }

    const variants = JSON.parse(variantsNode.textContent);
    const selectedOptions = qsa('[data-typsh-option-group]', root).map((group) => {
      const checked = qs('input:checked', group);
      return checked ? checked.value : '';
    });

    const variant = matchingVariant(variants, selectedOptions) || variants[0];
    if (!variant) {
      return;
    }

    qsa('[data-typsh-variant-id]', root).forEach((input) => {
      input.value = variant.id;
    });

    qsa('[data-typsh-price]', root).forEach((node) => {
      node.textContent = moneyFormat(variant.price);
    });

    qsa('[data-typsh-compare-price]', root).forEach((node) => {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        node.textContent = moneyFormat(variant.compare_at_price);
        node.hidden = false;
      } else {
        node.hidden = true;
      }
    });

    qsa('[data-typsh-variant-title]', root).forEach((node) => {
      node.textContent = variant.options.filter(Boolean).join(' / ') || 'Default option';
    });

    qsa('[data-typsh-stock-label]', root).forEach((node) => {
      if (variant.available) {
        if (typeof variant.inventory_quantity === 'number' && variant.inventory_quantity > 0 && variant.inventory_quantity <= 12) {
          node.textContent = `Only ${variant.inventory_quantity} left`; 
        } else {
          node.textContent = 'Ready to ship';
        }
        node.style.color = '';
      } else {
        node.textContent = 'Sold out';
        node.style.color = '#ff9b9b';
      }
    });

    qsa('[data-typsh-submit]', root).forEach((button) => {
      button.disabled = !variant.available;
      button.textContent = variant.available ? (button.dataset.availableLabel || 'Add to cart') : 'Sold out';
    });

    if (variant.featured_media && variant.featured_media.id) {
      qsa('[data-typsh-media-item]', root).forEach((item) => {
        item.hidden = item.dataset.mediaId !== String(variant.featured_media.id);
      });
      qsa('[data-typsh-media-thumb]', root).forEach((thumb) => {
        thumb.setAttribute('aria-pressed', thumb.dataset.mediaId === String(variant.featured_media.id) ? 'true' : 'false');
      });
    }
  }

  function bindProductRoot(root) {
    qsa('[data-typsh-option-input]', root).forEach((input) => {
      input.addEventListener('change', () => updateProductRoot(root));
    });

    qsa('[data-typsh-media-thumb]', root).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const mediaId = thumb.dataset.mediaId;
        qsa('[data-typsh-media-item]', root).forEach((item) => {
          item.hidden = item.dataset.mediaId !== mediaId;
        });
        qsa('[data-typsh-media-thumb]', root).forEach((node) => {
          node.setAttribute('aria-pressed', node === thumb ? 'true' : 'false');
        });
      });
    });

    const observeNode = qs('[data-typsh-buy-box]', root);
    const stickyBar = qs('[data-typsh-sticky-bar]', root);
    if (observeNode && stickyBar && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            stickyBar.classList.toggle('is-hidden', entry.isIntersecting);
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(observeNode);
    }

    updateProductRoot(root);

    const productHandle = root.dataset.productHandle;
    if (productHandle) {
      const current = JSON.parse(localStorage.getItem('typshRecentlyViewed') || '[]');
      const next = [productHandle].concat(current.filter((handle) => handle !== productHandle)).slice(0, 8);
      localStorage.setItem('typshRecentlyViewed', JSON.stringify(next));
    }
  }

  async function renderRecentlyViewed(container) {
    const currentHandle = container.dataset.currentHandle;
    const stored = JSON.parse(localStorage.getItem('typshRecentlyViewed') || '[]').filter((handle) => handle !== currentHandle).slice(0, 4);

    if (!stored.length) {
      container.hidden = true;
      return;
    }

    const products = await Promise.all(
      stored.map((handle) => fetch(`/products/${handle}.js`).then((response) => (response.ok ? response.json() : null)).catch(() => null))
    );

    const valid = products.filter(Boolean);
    if (!valid.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    container.innerHTML = valid
      .map((product) => {
        const image = product.featured_image ? `<img src="${product.featured_image}" alt="${product.title}">` : '<div class="typsh-commerce-empty">No image</div>';
        return `
          <article class="typsh-commerce-card">
            <a class="typsh-commerce-card__media" href="/products/${product.handle}">${image}</a>
            <div class="typsh-commerce-grid" style="gap:10px;">
              <h3 class="typsh-commerce-card__title">${product.title}</h3>
              <p class="typsh-commerce-card__copy">${(product.body_html || '').replace(/<[^>]*>/g, '').split(' ').slice(0, 18).join(' ')}</p>
              <div class="typsh-commerce-card__row">
                <div class="typsh-commerce-card__price"><strong>${moneyFormat(product.price)}</strong></div>
                <a class="typsh-commerce-link-button" href="/products/${product.handle}">View product</a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  document.addEventListener('click', (event) => {
    const cartToggle = event.target.closest('[data-cart-toggle]');
    if (cartToggle) {
      event.preventDefault();
      fetchCart().then(renderCart).then(openDrawer).catch(() => openDrawer());
      return;
    }

    if (event.target.closest('[data-cart-close]') || event.target.closest('[data-typsh-cart-overlay]')) {
      closeDrawer();
      return;
    }

    const qtyButton = event.target.closest('[data-cart-qty-change]');
    if (qtyButton) {
      updateCartQuantity(qtyButton.dataset.lineKey, Number(qtyButton.dataset.quantity)).catch(() => null);
      return;
    }

    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      updateCartQuantity(removeButton.dataset.lineKey, 0).catch(() => null);
      return;
    }

    const filterToggle = event.target.closest('[data-filter-toggle]');
    if (filterToggle) {
      const drawer = qs('[data-filter-drawer]');
      if (drawer) {
        drawer.hidden = false;
        drawer.classList.add('is-open');
      }
      return;
    }

    if (event.target.closest('[data-filter-close]') || event.target.closest('[data-filter-overlay]')) {
      const drawer = qs('[data-filter-drawer]');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.hidden = true;
      }
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-typsh-ajax-cart-form]');
    if (!form) {
      return;
    }
    event.preventDefault();
    addToCart(form).catch(() => null);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      const drawer = qs('[data-filter-drawer]');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.hidden = true;
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    qsa('[data-typsh-product-root]').forEach(bindProductRoot);
    qsa('[data-typsh-recently-viewed]').forEach((container) => {
      renderRecentlyViewed(container).catch(() => {
        container.hidden = true;
      });
    });
    fetchCart().then(renderCart).catch(() => null);
  });
})();