"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

export default function SignupForm() {
  // Using useActionState to handle server action states
  const [errorMessage, formAction, isPending] = useActionState(
    signup,
    undefined
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign up</CardTitle>
        <CardDescription>
          Enter your email and password to create the account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign Up
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
