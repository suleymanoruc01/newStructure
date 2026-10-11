import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/devops-reporter";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError(error.message, `${error.stack ?? ""}\n${info.componentStack}`);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm text-destructive" role="alert">
          Beklenmeyen bir hata oluştu. DevOps kayıtlarına gönderildi.
        </div>
      );
    }
    return this.props.children;
  }
}
