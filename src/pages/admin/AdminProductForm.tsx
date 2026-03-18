import { useEffect, useState } from "react";
import { productApi } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    price: 0,
    originalPrice: 0,
    discount: 0,
    image: "",
    category: "",
    isMall: false,
    stock: 0,
  });

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const res = await productApi.getById(id);
        setProduct({
          name: res.data.name,
          price: res.data.price,
          originalPrice: res.data.originalPrice,
          discount: res.data.discount,
          image: res.data.image,
          category: res.data.category,
          isMall: !!res.data.isMall,
          stock: res.data.stock ?? 0,
        });
      };
      fetchProduct();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setProduct({ ...product, [name]: checked });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (id) {
      await productApi.update(id, product, token || "");
    } else {
      await productApi.create(product, token || "");
    }
    navigate("/admin/products");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {id ? "Edit Product" : "New Product"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Original Price
            </label>
            <input
              type="number"
              name="originalPrice"
              value={product.originalPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image URL
          </label>
          <input
            type="text"
            name="image"
            value={product.image}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <input
            type="text"
            name="category"
            value={product.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Stock
          </label>
          <input
            type="number"
            name="stock"
            value={product.stock}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm focus:border-shopee-blue focus:ring-shopee-blue sm:text-sm"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isMall"
            checked={product.isMall}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-shopee-blue focus:ring-shopee-blue"
          />
          <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Is Mall Product?
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="liquid-btn text-white font-bold py-2 px-4 rounded-lg"
          >
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
