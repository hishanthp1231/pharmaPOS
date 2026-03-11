# Menu System API Documentation

This document provides detailed information about the Menu System API endpoints for managing menu items, categories, and variants in the Restaurant POS system.

## Base URL

All API endpoints are prefixed with `/api/`.

## Authentication

All endpoints require authentication. Include a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## Categories

### Get All Categories

```
GET /categories?branch_id=:branch_id&include_inactive=false
```

**Query Parameters:**
- `branch_id` (required): The ID of the branch
- `include_inactive` (optional, default: false): Whether to include inactive categories

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Appetizers",
      "description": "Delicious starters to begin your meal",
      "is_active": true,
      "created_at": "2023-07-30T10:00:00.000Z",
      "updated_at": "2023-07-30T10:00:00.000Z"
    }
  ]
}
```

### Create a Category

```
POST /categories
```

**Request Body:**
```json
{
  "name": "Appetizers",
  "description": "Delicious starters to begin your meal",
  "branch_id": 1,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Appetizers",
    "description": "Delicious starters to begin your meal",
    "is_active": true,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T10:00:00.000Z"
  }
}
```

### Update a Category

```
PUT /categories/:id
```

**Request Body:**
```json
{
  "name": "Starters",
  "description": "Updated description",
  "branch_id": 1,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Starters",
    "description": "Updated description",
    "is_active": true,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T11:00:00.000Z"
  }
}
```

### Delete a Category

```
DELETE /categories/:id
```

**Request Body:**
```json
{
  "branch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

## Variants

### Get All Variant Types

```
GET /variants?branch_id=:branch_id
```

**Query Parameters:**
- `branch_id` (required): The ID of the branch

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "Size",
      "options": [
        {
          "name": "Small",
          "price_adjustment": 0,
          "is_default": true
        },
        {
          "name": "Medium",
          "price_adjustment": 1.5,
          "is_default": false
        }
      ]
    }
  ]
}
```

### Create a Variant Type

```
POST /variants
```

**Request Body:**
```json
{
  "name": "Spice Level",
  "branch_id": 1,
  "options": [
    {
      "name": "Mild",
      "price_adjustment": 0,
      "is_default": true
    },
    {
      "name": "Medium",
      "price_adjustment": 0,
      "is_default": false
    },
    {
      "name": "Hot",
      "price_adjustment": 0.5,
      "is_default": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Spice Level",
    "branch_id": 1,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T10:00:00.000Z",
    "options": [
      {
        "id": 4,
        "variant_type_id": 2,
        "name": "Mild",
        "price_adjustment": 0,
        "is_default": true,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T10:00:00.000Z"
      },
      {
        "id": 5,
        "variant_type_id": 2,
        "name": "Medium",
        "price_adjustment": 0,
        "is_default": false,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T10:00:00.000Z"
      },
      {
        "id": 6,
        "variant_type_id": 2,
        "name": "Hot",
        "price_adjustment": 0.5,
        "is_default": false,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T10:00:00.000Z"
      }
    ]
  }
}
```

### Update a Variant Type

```
PUT /variants/:id
```

**Request Body:**
```json
{
  "name": "Spice Level",
  "branch_id": 1,
  "options": [
    {
      "name": "Mild",
      "price_adjustment": 0,
      "is_default": true
    },
    {
      "name": "Medium",
      "price_adjustment": 0.25,
      "is_default": false
    },
    {
      "name": "Hot",
      "price_adjustment": 0.5,
      "is_default": false
    },
    {
      "name": "Extra Hot",
      "price_adjustment": 0.75,
      "is_default": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Spice Level",
    "branch_id": 1,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T11:00:00.000Z",
    "options": [
      {
        "id": 4,
        "variant_type_id": 2,
        "name": "Mild",
        "price_adjustment": 0,
        "is_default": true,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T11:00:00.000Z"
      },
      {
        "id": 5,
        "variant_type_id": 2,
        "name": "Medium",
        "price_adjustment": 0.25,
        "is_default": false,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T11:00:00.000Z"
      },
      {
        "id": 6,
        "variant_type_id": 2,
        "name": "Hot",
        "price_adjustment": 0.5,
        "is_default": false,
        "branch_id": 1,
        "created_at": "2023-07-30T10:00:00.000Z",
        "updated_at": "2023-07-30T11:00:00.000Z"
      },
      {
        "id": 7,
        "variant_type_id": 2,
        "name": "Extra Hot",
        "price_adjustment": 0.75,
        "is_default": false,
        "branch_id": 1,
        "created_at": "2023-07-30T11:00:00.000Z",
        "updated_at": "2023-07-30T11:00:00.000Z"
      }
    ]
  }
}
```

### Delete a Variant Type

```
DELETE /variants/:id
```

**Request Body:**
```json
{
  "branch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Variant type deleted successfully"
}
```

## Menu Items

### Get All Menu Items

```
GET /menu-items?branch_id=:branch_id&category_id=:category_id&include_inactive=false
```

**Query Parameters:**
- `branch_id` (required): The ID of the branch
- `category_id` (optional): Filter by category ID
- `include_inactive` (optional, default: false): Whether to include inactive items

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Spring Rolls",
      "description": "Crispy vegetable spring rolls with sweet chili sauce",
      "price": 5.99,
      "category_id": 1,
      "branch_id": 1,
      "is_vegetarian": true,
      "is_vegan": false,
      "is_gluten_free": false,
      "is_available": true,
      "image_url": "/uploads/spring-rolls.jpg",
      "preparation_time": 10,
      "created_at": "2023-07-30T10:00:00.000Z",
      "updated_at": "2023-07-30T10:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Appetizers",
        "description": "Delicious starters to begin your meal"
      },
      "variants": [
        {
          "id": 1,
          "name": "Size",
          "is_required": true,
          "options": [
            {
              "id": 1,
              "name": "Small",
              "price_adjustment": 0,
              "is_default": true,
              "is_available": true
            },
            {
              "id": 2,
              "name": "Medium",
              "price_adjustment": 1.5,
              "is_default": false,
              "is_available": true
            }
          ]
        }
      ]
    }
  ]
}
```

### Create a Menu Item

```
POST /menu-items
```

**Request Body (multipart/form-data):**
```
name: "Spring Rolls"
description: "Crispy vegetable spring rolls with sweet chili sauce"
price: 5.99
category_id: 1
branch_id: 1
is_vegetarian: true
is_vegan: false
is_gluten_free: false
is_available: true
preparation_time: 10
variants: [
  {
    "variant_type_id": 1,
    "is_required": true,
    "options": [
      {
        "variant_option_id": 1,
        "price_adjustment": 0,
        "is_available": true
      },
      {
        "variant_option_id": 2,
        "price_adjustment": 1.5,
        "is_available": true
      }
    ]
  }
]
image: <file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Spring Rolls",
    "description": "Crispy vegetable spring rolls with sweet chili sauce",
    "price": 5.99,
    "category_id": 1,
    "branch_id": 1,
    "is_vegetarian": true,
    "is_vegan": false,
    "is_gluten_free": false,
    "is_available": true,
    "image_url": "/uploads/spring-rolls.jpg",
    "preparation_time": 10,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T10:00:00.000Z"
  }
}
```

### Update a Menu Item

```
PUT /menu-items/:id
```

**Request Body (multipart/form-data):**
```
name: "Spring Rolls (6 pcs)"
description: "Crispy vegetable spring rolls with sweet chili sauce (6 pieces)"
price: 6.99
category_id: 1
branch_id: 1
is_vegetarian: true
is_vegan: false
is_gluten_free: false
is_available: true
preparation_time: 10
variants: [
  {
    "variant_type_id": 1,
    "is_required": true,
    "options": [
      {
        "variant_option_id": 1,
        "price_adjustment": 0,
        "is_available": true
      },
      {
        "variant_option_id": 2,
        "price_adjustment": 1.5,
        "is_available": true
      },
      {
        "variant_option_id": 3,
        "price_adjustment": 2.5,
        "is_available": true
      }
    ]
  }
]
image: <file> (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Spring Rolls (6 pcs)",
    "description": "Crispy vegetable spring rolls with sweet chili sauce (6 pieces)",
    "price": 6.99,
    "category_id": 1,
    "branch_id": 1,
    "is_vegetarian": true,
    "is_vegan": false,
    "is_gluten_free": false,
    "is_available": true,
    "image_url": "/uploads/spring-rolls.jpg",
    "preparation_time": 10,
    "created_at": "2023-07-30T10:00:00.000Z",
    "updated_at": "2023-07-30T11:00:00.000Z"
  }
}
```

### Delete a Menu Item

```
DELETE /menu-items/:id
```

**Request Body:**
```json
{
  "branch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "error": "Detailed error message (only in development)"
}
```
