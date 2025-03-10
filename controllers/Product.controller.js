const { default: slugify } = require("slugify");
const Product = require("../models/product.model.js");
const fs = require("fs");
const Order = require("../models/order.model.js");

// payment gateway
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { image } = req.files;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (image && image.size > 1000000) {
      return res.status(400).json({ message: "Image should be less than 1mb" });
    }
    const products = new Product({
      ...req.fields,
      slug: slugify(name),
    });
    if (image) {
      products.image.data = fs.readFileSync(image.path);
      products.image.contentType = image.type;
    }
    await products.save();
    return res
      .status(201)
      .json({ success: true, message: "Product created", products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not create Product" });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .select("-image")
      .populate("category")
      .limit(12)
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      total: products.length,
      products,
      message: "All products",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not get products" });
  }
};

// get single product
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category")
      .select("-image");
    return res.status(200).send({ success: true, message: "Product", product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not get product" });
  }
};

// get photo
exports.getPhoto = async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).select("image");
    if (product.image.data) {
      res.set("Content-Type", product.image.contentType);
      return res.status(200).send(product.image.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not get photo" });
  }
};

// delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.pid);
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not delete product" });
  }
};

// update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { image } = req.files;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (image && image.size > 1000000) {
      return res.status(400).json({ message: "Image should be less than 1mb" });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.pid,
      {
        ...req.fields,
        slug: slugify(name),
      },
      { new: true }
    );
    if (image) {
      product.image.data = fs.readFileSync(image.path);
      product.image.contentType = image.type;
    }
    await product.save();
    return res
      .status(200)
      .json({ success: true, message: "Product updated", product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Can not update product" });
  }
};

// filter product
exports.filterProduct = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) {
      args.category = checked;
    }
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await Product.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};

// search product
exports.searchProduct = async (req, res) => {
  try {
    const { keyword } = req.params;
    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};

// get similar Products
exports.similarProducts = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await Product.find({
      category: cid,
      _id: { $ne: pid },
    })
      .limit(4)
      .select("-image")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Similar Product fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in fetching similar Products",
      error,
    });
  }
};

