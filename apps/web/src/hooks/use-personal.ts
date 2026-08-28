"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type {
  CreatePersonalAccountInput,
  CreatePersonalBudgetInput,
  CreatePersonalCategoryInput,
  CreatePersonalTransactionInput,
} from "@evensplit/shared";
import { useAuth } from "@/hooks/use-auth";
import {
  archivePersonalAccount,
  createPersonalAccount,
  createPersonalCategory,
  createPersonalTransaction,
  deletePersonalBudget,
  deletePersonalCategory,
  deletePersonalTransaction,
  fetchPersonalAccounts,
  fetchPersonalBudgets,
  fetchPersonalCategories,
  fetchPersonalTransactions,
  upsertPersonalBudget,
} from "@/lib/api/personal";

export function usePersonalAccounts() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["personal-accounts", authUser?.id],
    queryFn: () => fetchPersonalAccounts(authUser!.id),
    enabled: !!authUser?.id,
  });
}

export function usePersonalCategories() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["personal-categories", authUser?.id],
    queryFn: () => fetchPersonalCategories(authUser!.id),
    enabled: !!authUser?.id,
  });
}

export function usePersonalTransactions() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["personal-transactions", authUser?.id],
    queryFn: () => fetchPersonalTransactions(authUser!.id),
    enabled: !!authUser?.id,
  });
}

export function usePersonalBudgets() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["personal-budgets", authUser?.id],
    queryFn: () => fetchPersonalBudgets(authUser!.id),
    enabled: !!authUser?.id,
  });
}

export function useCreatePersonalAccount() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonalAccountInput) => createPersonalAccount(authUser!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-accounts", authUser?.id] }),
  });
}

export function useArchivePersonalAccount() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => archivePersonalAccount(accountId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-accounts", authUser?.id] }),
  });
}

export function useCreatePersonalCategory() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonalCategoryInput) => createPersonalCategory(authUser!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-categories", authUser?.id] }),
  });
}

export function useDeletePersonalCategory() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deletePersonalCategory(categoryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-categories", authUser?.id] }),
  });
}

export function useCreatePersonalTransaction() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonalTransactionInput) => createPersonalTransaction(authUser!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-transactions", authUser?.id] }),
  });
}

export function useDeletePersonalTransaction() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => deletePersonalTransaction(transactionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-transactions", authUser?.id] }),
  });
}

export function useUpsertPersonalBudget() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonalBudgetInput) => upsertPersonalBudget(authUser!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-budgets", authUser?.id] }),
  });
}

export function useDeletePersonalBudget() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budgetId: string) => deletePersonalBudget(budgetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-budgets", authUser?.id] }),
  });
}
