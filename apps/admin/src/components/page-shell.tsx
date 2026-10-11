import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageShellProps = {
  title: string;
  screenId: string;
  children: ReactNode;
};

export function PageShell({ title, screenId, children }: PageShellProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <p className="sr-only">{screenId}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
