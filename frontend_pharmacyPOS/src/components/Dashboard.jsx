import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/axios';
import AddProduct from './AddProduct';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Paper,
  Tabs,
  Tab,
  Divider,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
    if (isAuthenticated()) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchOrders = async () => {
    try {
      if (!user) {
        console.log('Waiting for user data...');
        return;
      }
      
      if (!user.id) {
        console.log('User ID not available, please log in again');
        return;
      }

      const response = await api.get(`/orders/user/${user.id}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 404) {
        console.log('No orders found for user');
        setOrders([]);
      } else {
      toast.error('Failed to fetch orders');
      }
    }
  };

  const handleProductAdded = (newProduct) => {
    setProducts([...products, newProduct]);
    setShowAddProduct(false);
    toast.success('Product added successfully');
  };

  const getAvailableQuantity = (product) => {
    const cartItem = cart.find(item => item.id === product.id);
    return product.quantity - (cartItem?.quantity || 0);
  };

  const addToCart = (product) => {
    const availableQuantity = getAvailableQuantity(product);
    if (availableQuantity <= 0) {
      toast.error('Not enough stock available');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const availableQuantity = getAvailableQuantity(product) + (cart.find(item => item.id === productId)?.quantity || 0);
    if (newQuantity > availableQuantity) {
      toast.error('Not enough stock available');
      return;
    }

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    try {
      if (!customerName.trim()) {
        toast.error('Please enter customer name');
        return;
      }

      if (cart.length === 0) {
        toast.error('Cart is empty');
        return;
      }

      const orderData = {
        customerName: customerName.trim(),
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        userId: user.id
      };

      const response = await api.post('/orders', orderData);
      
      if (response.data) {
        toast.success('Order added successfully');
        setCart([]);
        setCustomerName('');
        await fetchProducts();
        await fetchOrders();
        setActiveTab('orders');
      }
    } catch (error) {
      console.error('Error adding order:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add order. Please try again.');
      }
    }
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(product => product.category))];
    return ['All', ...categories];
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const openDeleteDialog = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setOrderToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      handleDeleteOrder(orderToDelete.id);
      closeDeleteDialog();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%', p: 1 }}>
        {/* Left side: Orders and Products */}
        <Grid item xs={12} md={8} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Recent Orders Section */}
          <Paper elevation={0} sx={{ p: 1.5, mb: 2, flex: '0 0 auto' }}>
            <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
              <ReceiptIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
              Recent Orders
            </Typography>
            
            <Box sx={{ maxHeight: '200px', overflowY: 'auto', mb: 1 }}>
              {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders found
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1}>
                  {orders.slice(0, 3).map((order) => (
                    <Grid item xs={12} key={order.id}>
                      <Card sx={{ 
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: 1,
                          transition: 'box-shadow 0.2s ease-in-out',
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 0.5 
                        }}>
                          <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%' }}>
                            {order.customerName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              ${(order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(order)}
                              sx={{ 
                                p: 0.5,
                                '&:hover': { backgroundColor: 'error.lighter' }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(order.orderDate)}
                        </Typography>

                        <Box sx={{ 
                          mt: 1,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          fontSize: '0.75rem'
                        }}>
                          {(order.items || []).map(item => {
                            const productName = item.product?.name || item.productName || 'Unknown Product';
                            return (
                              <Typography
                                key={item.id}
                                variant="caption"
                                sx={{
                                  backgroundColor: 'action.hover',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-block'
                                }}
                              >
                                {productName.length > 15 ? `${productName.substring(0, 15)}...` : productName} × {item.quantity}
                              </Typography>
                            );
                          })}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>

          {/* Products Section */}
          <Paper elevation={0} sx={{ p: 1.5, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.1rem' }} />,
                }}
                sx={{ flex: 1, minWidth: '200px' }}
              />
              <Select
                size="small"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                variant="outlined"
                sx={{ minWidth: 120, maxWidth: '200px' }}
                startAdornment={<CategoryIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.1rem' }} />}
              >
                {getCategories().map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
              <Tooltip title="Add New Product">
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => setShowAddProduct(true)}
                  startIcon={<InventoryIcon sx={{ fontSize: '1.1rem' }} />}
                >
                  Add Product
                </Button>
              </Tooltip>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              <Grid container spacing={1}>
                {filteredProducts.map((product) => {
                  const availableQuantity = getAvailableQuantity(product);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: 1,
                          transition: 'box-shadow 0.2s ease-in-out',
                        }
                      }}>
                        <CardContent>
                          <Typography variant="h6" component="div" noWrap>
                            {product.name}
                          </Typography>
                          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                            {product.description}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${product.price.toFixed(2)}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center'
                          }}>
                            <Typography 
                              variant="caption" 
                              color={availableQuantity > 0 ? "text.secondary" : "error"}
                              sx={{ fontWeight: availableQuantity > 0 ? 'normal' : 'bold' }}
                            >
                              {availableQuantity > 0 
                                ? `Available: ${availableQuantity}`
                                : 'Out of Stock'
                              }
                            </Typography>
                            {cart.find(item => item.id === product.id) && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.7rem'
                                }}
                              >
                                In Cart: {cart.find(item => item.id === product.id).quantity}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right side: Shopping Cart */}
        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 1.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.paper',
              '&:hover': {
                boxShadow: 1,
                transition: 'box-shadow 0.2s ease-in-out',
              }
            }}
          >
            <Typography variant="h6" sx={{ 
              mb: 1.5,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CartIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
              Shopping Cart
            </Typography>
            
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.1rem' }} />,
              }}
            />

            <Box sx={{ 
              flex: 1,
              overflowY: 'auto',
              mb: 1.5,
              pr: 0.5
            }}>
              {cart.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: 'text.secondary',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}>
                  <CartIcon sx={{ fontSize: '2rem', mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">
                    Your cart is empty
                  </Typography>
                </Box>
              ) : (
                cart.map(item => (
                  <Card key={item.id} sx={{ 
                    mb: 1, 
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 1,
                      transition: 'box-shadow 0.2s ease-in-out',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ flex: 1 }}>{item.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Card>
                ))
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              Total: ${calculateTotal().toFixed(2)}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleCheckout}
              startIcon={<ReceiptIcon />}
              disabled={cart.length === 0 || !customerName.trim()}
              sx={{
                py: 1.5,
                '&.Mui-disabled': {
                  backgroundColor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              Complete Order
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Product Modal */}
      <AddProduct
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this order for customer "{orderToDelete?.customerName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 
