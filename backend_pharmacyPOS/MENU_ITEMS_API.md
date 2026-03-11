# Menu Items API Documentation

This document describes the API endpoints for managing menu items, categories, and variants in the Restaurant POS system.

## Base URL
All API endpoints are prefixed with `/api`.

## Authentication
All endpoints require authentication. Include a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

## Menu Items

### Get All Menu Items
```
GET /menu-items
```

**Query Parameters:**
- `branch_id` (required): Filter by branch ID
- `category_id` (optional): Filter by category ID
- `search` (optional): Search term to filter by name or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "category_id": 1,
      "category_name": "Pizza",
      "image": "pizza.jpg",
      "is_available": true,
      "branch_id": 1,
      "variants": [
        {
          "id": 1,
          "name": "Size",
          "options": [
            {
              "id": 1,
              "name": "Small",
              "price_adjustment": 0.00
            },
            {
              "id": 2,
              "name": "Medium",
              "price_adjustment": 2.00
            },
            {
              "id": 3,
              "name": "Large",
              "price_adjustment": 4.00
            }
          ]
        }
      ]
    }
  ]
}
```

### Get Single Menu Item
```
GET /menu-items/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato and mozzarella",
    "category_id": 1,
    "category_name": "Pizza",
    "image": "pizza.jpg",
    "is_available": true,
    "branch_id": 1,
    "variants": [
      {
        "id": 1,
        "name": "Size",
        "options": [
          {
            "id": 1,
            "name": "Small",
            "price_adjustment": 0.00
          },
          {
            "id": 2,
            "name": "Medium",
            "price_adjustment": 2.00
          },
          {
            "id": 3,
            "name": "Large",
            "price_adjustment": 4.00
          }
        ]
      }
    ]
  }
}
```

### Create Menu Item
```
POST /menu-items
```

**Form Data:**
- `name` (required): Name of the menu item
- `description`: Description of the menu item
- `category_id` (required): ID of the category
- `is_available`: Boolean indicating if the item is available (default: true)
- `branch_id` (required): ID of the branch
- `image`: Image file (optional)
- `variants`: JSON string of variants (see example below)

**Example Request Body (multipart/form-data):**
```
name: Margherita Pizza
description: Classic pizza with tomato and mozzarella
category_id: 1
is_available: true
branch_id: 1
variants: [{"type": "Size", "options": [{"name": "Small", "price_adjustment": 0}, {"name": "Medium", "price_adjustment": 2}, {"name": "Large", "price_adjustment": 4}]}]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato and mozzarella",
    "category_id": 1,
    "image": "pizza.jpg",
    "is_available": true,
    "branch_id": 1,
    "variants": [
      {
        "id": 1,
        "name": "Size",
        "menu_item_id": 1,
        "branch_id": 1,
        "options": [
          {
            "id": 1,
            "variant_type_id": 1,
            "name": "Small",
            "price_adjustment": 0.00,
            "menu_item_id": 1,
            "branch_id": 1
          },
          {
            "id": 2,
            "variant_type_id": 1,
            "name": "Medium",
            "price_adjustment": 2.00,
            "menu_item_id": 1,
            "branch_id": 1
          },
          {
            "id": 3,
            "variant_type_id": 1,
            "name": "Large",
            "price_adjustment": 4.00,
            "menu_item_id": 1,
            "branch_id": 1
          }
        ]
      }
    ]
  }
}
```

### Update Menu Item
```
PUT /menu-items/:id
```

**Form Data:**
Same as create, but all fields are optional.

**Response:**
Same as create, but with updated data.

### Delete Menu Item
```
DELETE /menu-items/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

## Categories

### Get All Categories
```
GET /categories
```

**Query Parameters:**
- `branch_id` (required): Filter by branch ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pizza",
      "branch_id": 1
    },
    {
      "id": 2,
      "name": "Beverages",
      "branch_id": 1
    }
  ]
}
```

### Create Category
```
POST /categories
```

**Request Body:**
```json
{
  "name": "Desserts",
  "branch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Desserts",
    "branch_id": 1
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Menu item not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```
