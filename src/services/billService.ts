import { supabase } from "@/integrations/supabase/client";
import { Bill, BillItem, BillWithItems, mapRawBillToBill, mapRawBillItemToBillItem, Product } from "@/types/supabase-extensions";
import { CartItem } from "@/hooks/useBillingCart";

export const createBill = async (billData: {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: string;
  status?: string;
  discountAmount?: number;
  discountType?: "percent" | "amount";
  discountValue?: number;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    
    if (!userId) {
      console.warn("No authenticated user found, using system user");
    }
    
    const { data: billResult, error: billError } = await supabase
      .from('bills')
      .insert({
        subtotal: billData.subtotal,
        tax: billData.tax,
        total: billData.total,
        customer_name: billData.customerName,
        customer_phone: billData.customerPhone,
        customer_email: billData.customerEmail,
        payment_method: billData.paymentMethod,
        status: billData.status || 'completed',
        user_id: userId || 'system'
      })
      .select()
      .single();

    if (billError) throw billError;
    if (!billResult) throw new Error('No bill created');

    const billItems = billData.cartItems.map(item => ({
      bill_id: billResult.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      discount_percentage: item.product.discountPercentage,
      total: item.product.price * item.quantity * (1 - item.product.discountPercentage / 100)
    }));

    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems);

    if (itemsError) throw itemsError;

    const billWithItems: BillWithItems = {
      ...mapRawBillToBill(billResult),
      discountAmount: billData.discountAmount,
      discountType: billData.discountType,
      discountValue: billData.discountValue,
      items: billData.cartItems.map(item => ({
        id: '',
        createdAt: new Date().toISOString(),
        billId: billResult.id,
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        discountPercentage: item.product.discountPercentage,
        total: item.product.price * item.quantity * (1 - item.product.discountPercentage / 100),
        product: item.product
      })),
      subtotal: billData.subtotal,
      tax: billData.tax,
      total: billData.total,
      paymentMethod: billData.paymentMethod
    };

    return billWithItems;
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
};

export const getBillById = async (billId: string): Promise<BillWithItems | null> => {
  try {
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (billError) throw billError;
    if (!billData) return null;

    const bill = mapRawBillToBill(billData);

    const { data: itemsData, error: itemsError } = await supabase
      .from('bill_items')
      .select('*, products(*)')
      .eq('bill_id', billId);

    if (itemsError) throw itemsError;

    const items = itemsData ? itemsData.map(item => {
      const billItem = mapRawBillItemToBillItem(item);
      
      const product = item.products ? {
        id: item.products.id,
        name: item.products.name,
        brand: item.products.brand,
        category: item.products.category,
        description: item.products.description || '',
        price: item.products.price,
        buyingPrice: item.products.buying_price || 0,
        discountPercentage: item.products.discount_percentage,
        stock: item.products.stock,
        lowStockThreshold: item.products.low_stock_threshold,
        image: item.products.image || '',
        color: item.products.color || null,
        itemNumber: item.products.item_number,
        createdAt: item.products.created_at,
        updatedAt: item.products.updated_at,
        quantity: item.products.stock || 0,
        imageUrl: item.products.image || '',
        userId: 'system',
        sizes_stock: item.products.sizes_stock || {}
      } : null;

      return {
        ...billItem,
        product: product as Product
      };
    }) : [];

    return {
      ...bill,
      items: items || [],
      subtotal: bill.subtotal || 0,
      tax: bill.tax || 0,
      total: bill.total || 0,
      paymentMethod: bill.paymentMethod || 'cash'
    };
  } catch (error) {
    console.error('Error fetching bill by ID:', error);
    throw error;
  }
};

export const deleteBill = async (billId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for bill ${billId}`);
    
    // First check if bill exists
    const { data: existingBill, error: checkError } = await supabase
      .from('bills')
      .select('id')
      .eq('id', billId)
      .single();
      
    if (checkError) {
      // If error is not 'not found'
      if (checkError.code !== 'PGRST116') {
        console.error('Error checking if bill exists:', checkError);
        throw checkError;
      }
      // Bill doesn't exist, consider it "deleted"
      console.log(`Bill ${billId} not found (possibly already deleted)`);
      return true;
    }
    
    if (!existingBill) {
      console.log(`Bill ${billId} not found, nothing to delete`);
      return true;
    }

    console.log(`Found bill ${billId}, proceeding with deletion`);

    // Delete bill items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('bill_items')
      .delete()
      .eq('bill_id', billId);

    if (itemsError) {
      console.error('Error deleting bill items:', itemsError);
      throw itemsError;
    }

    console.log(`Successfully deleted items for bill ${billId}`);

    // Then delete the bill itself
    const { error: billError } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);

    if (billError) {
      console.error('Error deleting bill:', billError);
      throw billError;
    }

    console.log(`Successfully deleted bill ${billId} and its items`);
    return true;
  } catch (error) {
    console.error('Error in deleteBill function:', error);
    throw error;
  }
};

export const sendBillToWhatsApp = async (bill: BillWithItems): Promise<boolean> => {
  try {
    if (!bill.customerPhone) {
      throw new Error('Customer phone number is required to send bill via WhatsApp');
    }

    console.log(`Sending bill ${bill.id} to ${bill.customerPhone} via WhatsApp`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error sending bill to WhatsApp:', error);
    throw error;
  }
};

export const getBills = async (): Promise<BillWithItems[]> => {
  try {
    console.log("Fetching all bills");
    
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (billsError) {
      console.error('Error fetching bills:', billsError);
      throw billsError;
    }
    
    if (!billsData) {
      console.log('No bills data returned');
      return [];
    }

    console.log(`Found ${billsData.length} bills`);

    const bills = billsData.map(rawBill => mapRawBillToBill(rawBill));

    const billsWithItems: BillWithItems[] = await Promise.all(bills.map(async bill => {
      const { data: itemsData, error: itemsError } = await supabase
        .from('bill_items')
        .select('*, products(*)')
        .eq('bill_id', bill.id);

      if (itemsError) {
        console.error('Error fetching bill items:', itemsError);
        return { 
          ...bill, 
          items: [],
          subtotal: bill.subtotal || 0,
          tax: bill.tax || 0,
          total: bill.total || 0,
          paymentMethod: bill.paymentMethod || 'cash'
        };
      }

      if (!itemsData) return { 
        ...bill, 
        items: [],
        subtotal: bill.subtotal || 0,
        tax: bill.tax || 0,
        total: bill.total || 0,
        paymentMethod: bill.paymentMethod || 'cash' 
      };

      const items = itemsData.map(item => {
        const billItem = mapRawBillItemToBillItem(item);
        
        const product = item.products ? {
          id: item.products.id,
          name: item.products.name,
          brand: item.products.brand,
          category: item.products.category,
          description: item.products.description || '',
          price: item.products.price,
          buyingPrice: item.products.buying_price || 0,
          discountPercentage: item.products.discount_percentage,
          stock: item.products.stock,
          lowStockThreshold: item.products.low_stock_threshold,
          image: item.products.image || '',
          color: item.products.color || null,
          itemNumber: item.products.item_number,
          createdAt: item.products.created_at,
          updatedAt: item.products.updated_at,
          quantity: item.products.stock || 0,
          imageUrl: item.products.image || '',
          userId: 'system',
          sizes_stock: item.products.sizes_stock || {}
        } : null;

        return {
          ...billItem,
          product: product as Product
        };
      });

      return {
        ...bill,
        items,
        subtotal: bill.subtotal || 0,
        tax: bill.tax || 0,
        total: bill.total || 0,
        paymentMethod: bill.paymentMethod || 'cash'
      };
    }));

    return billsWithItems;
  } catch (error) {
    console.error('Error fetching bills with items:', error);
    throw error;
  }
};
