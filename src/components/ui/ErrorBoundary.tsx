import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 bg-bg items-center justify-center px-6">
          <Text className="text-text-secondary text-5xl mb-4">⚡</Text>
          <Text className="text-text-primary text-xl font-semibold mb-2 text-center">
            Something went wrong
          </Text>
          <Text className="text-danger text-xs text-center mb-2 px-2" selectable>
            {this.state.error?.name}: {this.state.error?.message}
          </Text>
          <Text className="text-text-muted text-xs text-center mb-6 px-2" selectable>
            {this.state.error?.stack?.slice(0, 300)}
          </Text>
          <Pressable
            onPress={this.reset}
            className="bg-accent rounded-2xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
