import React, { forwardRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleScreen from '../screens/RoleScreen';
import LoginScreen from '../screens/LoginScreen';
import MerchantRegisterScreen from '../screens/MerchantRegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import PinLockScreen from '../screens/PinLockScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import KitchenOrderScreen from '../screens/KitchenOrderScreen';
import KhataScreen from '../screens/KhataScreen';
import KhataAddScreen from '../screens/KhataAddScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import StoreSettingsScreen from '../screens/StoreSettingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrdersScreen from '../screens/OrdersScreen';

import CustomerLoginScreen from '../screens/customer/CustomerLoginScreen';
import CustomerSignupScreen from '../screens/customer/CustomerSignupScreen';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';

const Stack = createNativeStackNavigator();

const BLUE = '#2563EB';

const AppNavigator = forwardRef<NavigationContainerRef<any>>((_, ref) => {
  return (
    <NavigationContainer ref={ref}>
      <Stack.Navigator
        initialRouteName="Role"
        screenOptions={{
          headerStyle: { backgroundColor: BLUE },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* Onboarding — role + language selection */}
        <Stack.Screen name="Role" component={RoleScreen} options={{ headerShown: false }} />

        {/* Merchant flow */}
        <Stack.Screen name="MerchantLogin" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MerchantRegister" component={MerchantRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewSale" component={NewSaleScreen} options={{ title: 'New Sale' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt', headerLeft: () => null }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Sales History' }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={({ route }) => ({
            title: (route.params as any)?.product ? 'Edit Product' : 'Add Product',
          })}
        />
        <Stack.Screen name="PinLock" component={PinLockScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="KitchenOrder" component={KitchenOrderScreen} options={{ title: 'Kitchen Order' }} />
        <Stack.Screen name="Khata" component={KhataScreen} options={{ title: 'Khata (Credit)' }} />
        <Stack.Screen name="KhataAdd" component={KhataAddScreen} options={{ title: 'New Khata Entry' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="StoreSettings" component={StoreSettingsScreen} options={{ title: 'Store Settings' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />

        {/* Customer flow */}
        <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CustomerSignup" component={CustomerSignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CustomerMain" component={CustomerHomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;
