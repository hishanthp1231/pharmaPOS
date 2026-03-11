import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const AddProduct = ({ open, onClose, onProductAdded }) => {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    quantity: '',
    description: '',
    category: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/products', {
        ...product,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity)
      });
      toast.success('Product added successfully');
      onProductAdded(response.data);
      handleReset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleReset = () => {
    setProduct({
      name: '',
      price: '',
      quantity: '',
      description: '',
      category: ''
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Add New Product
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={product.name}
              onChange={handleChange}
              required
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={product.price}
              onChange={handleChange}
              required
              variant="outlined"
              inputProps={{ step: "0.01", min: "0" }}
            />
            
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={product.quantity}
              onChange={handleChange}
              required
              variant="outlined"
              inputProps={{ min: "0" }}
            />
            
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={product.category}
              onChange={handleChange}
              required
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={product.description}
              onChange={handleChange}
              required
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { handleReset(); onClose(); }}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Add Product
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProduct; 
