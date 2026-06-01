'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  activationMode?: 'automatic' | 'manual'
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement> & {
  loop?: boolean
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
  forceMount?: true
}

const TabsRoot = TabsPrimitive.Root as React.ComponentType<TabsProps>
const TabsListRoot = TabsPrimitive.List as React.ComponentType<TabsListProps>
const TabsTriggerRoot = TabsPrimitive.Trigger as React.ComponentType<TabsTriggerProps>
const TabsContentRoot = TabsPrimitive.Content as React.ComponentType<TabsContentProps>

function Tabs({
  className,
  children,
  ...props
}: TabsProps) {
  return (
    <TabsRoot
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {children}
    </TabsRoot>
  )
}

function TabsList({
  className,
  children,
  ...props
}: TabsListProps) {
  return (
    <TabsListRoot
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    >
      {children}
    </TabsListRoot>
  )
}

function TabsTrigger({
  className,
  children,
  ...props
}: TabsTriggerProps) {
  return (
    <TabsTriggerRoot
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </TabsTriggerRoot>
  )
}

function TabsContent({
  className,
  children,
  ...props
}: TabsContentProps) {
  return (
    <TabsContentRoot
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    >
      {children}
    </TabsContentRoot>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
