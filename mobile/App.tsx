import React, { useEffect, useRef } from 'react';
import { AppState, TouchableWithoutFeedback, Keyboard, View } from 'react-native';
import { NavigationContainer, CommonActions, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from './src/contexts/ToastContext';
import { useAuthStore } from './src/store/useAuthStore';
import { useLocaleStore } from './src/store/useLocaleStore';
import { changeLanguage } from './src/i18n';
import { setOnUnauthenticated, getStoredTokens } from './src/services/api';
import { addNotificationResponseListener, setOnNotificationResponse } from './src/services/notifications';
import { RootNavigator } from './src/navigation/RootNavigator';
import i18n from './src/i18n';

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const prevUserRef = useRef(user);
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    (async () => {
      await hydrateLocale();
      changeLanguage(useLocaleStore.getState().locale);
    })();
    hydrateAuth();
  }, [hydrateLocale, hydrateAuth]);

  useEffect(() => {
    const prev = prevUserRef.current;
    if (prev?.id && !user?.id && navRef.current?.isReady()) {
      navRef.current.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] })
      );
    }
    // When user logs in (was logged out, now has role + onboarding done), navigate to Main
    if (!prev?.id && user?.id && user?.role && user?.onboarding_completed && navRef.current?.isReady()) {
      navRef.current.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
      );
    }
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    setOnUnauthenticated(() => {
      useAuthStore.getState().logout();
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        getStoredTokens().then(({ accessToken }) => {
          if (accessToken) useAuthStore.getState().hydrate();
        });
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setOnNotificationResponse((data) => {
      const nav = navRef.current;
      if (!nav?.isReady?.() || !useAuthStore.getState().user?.id) return;
      if (data.type === 'new_message' && data.conversation_id) {
        const otherName = (data as { sender_name?: string }).sender_name ?? i18n.t('nav.chat');
        nav.dispatch(
          CommonActions.navigate({
            name: 'ChatThread',
            params: { conversationId: data.conversation_id, otherName },
          })
        );
      } else if (data.type === 'support_reply') {
        nav.dispatch(CommonActions.navigate('Support'));
      }
    });
    const sub = addNotificationResponseListener();
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <NavigationContainer ref={navRef}>
              <RootNavigator />
            </NavigationContainer>
          </View>
        </TouchableWithoutFeedback>
        <StatusBar style="dark" />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
