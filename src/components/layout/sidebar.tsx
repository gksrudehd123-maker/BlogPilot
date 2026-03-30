'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  PenLine,
  Search,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface NavChild {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: NavChild[];
}

const navGroups: NavGroup[] = [
  {
    label: '글 관리',
    icon: PenLine,
    children: [
      { href: '/posts', label: '글 목록' },
      { href: '/posts/new', label: '새 글 쓰기' },
    ],
  },
  {
    label: '설정',
    icon: Settings,
    children: [
      { href: '/settings/sites', label: '사이트 설정' },
      { href: '/settings/ai/writing', label: '글쓰기 AI' },
      { href: '/settings/ai/image', label: '이미지 AI' },
      { href: '/settings/writing', label: '글쓰기 설정' },
    ],
  },
];

function TreeNav({
  collapsed,
  pathname,
  openGroups,
  toggleGroup,
}: {
  collapsed: boolean;
  pathname: string;
  openGroups: Record<string, boolean>;
  toggleGroup: (label: string) => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-2">
      {navGroups.map((group) => {
        const isGroupActive = group.children.some(
          (child) => pathname.startsWith(child.href)
        );
        const isOpen = openGroups[group.label] ?? isGroupActive;

        return (
          <div key={group.label}>
            {/* 그룹 헤더 */}
            <button
              onClick={() => toggleGroup(group.label)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isGroupActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? group.label : undefined}
            >
              <group.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </>
              )}
            </button>

            {/* 하위 메뉴 */}
            {!collapsed && isOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                {group.children.map((child) => {
                  const isActive = child.href === '/posts'
                    ? pathname === '/posts'
                    : pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 키워드분석 (단독 메뉴) */}
      <Link
        href="/keywords/analysis"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          pathname === '/keywords/analysis' || pathname.startsWith('/keywords')
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? '키워드분석' : undefined}
      >
        <Search className="h-5 w-5 shrink-0" />
        {!collapsed && <span>키워드분석</span>}
      </Link>

      {/* 통계 (단독 메뉴) */}
      <Link
        href="/"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          pathname === '/'
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? '통계' : undefined}
      >
        <BarChart3 className="h-5 w-5 shrink-0" />
        {!collapsed && <span>통계</span>}
      </Link>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 현재 경로에 해당하는 그룹 자동 열기
  useEffect(() => {
    navGroups.forEach((group) => {
      if (group.children.some((child) => pathname.startsWith(child.href))) {
        setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      }
    });
  }, [pathname]);

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3.5 z-50 rounded-lg p-2 hover:bg-muted transition-colors lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 데스크톱 사이드바 */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background transition-all duration-300',
          'max-lg:hidden',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">BlogPilot</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'rounded-lg p-1.5 hover:bg-muted transition-colors',
              collapsed ? 'mx-auto' : 'ml-auto',
            )}
            aria-label={collapsed ? '사이드바 열기' : '사이드바 접기'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="px-3 pt-3">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              메뉴
            </p>
          )}
        </div>

        <TreeNav
          collapsed={collapsed}
          pathname={pathname}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
        />
      </aside>

      {/* 모바일 사이드바 */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-background transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">BlogPilot</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            메뉴
          </p>
        </div>

        <TreeNav
          collapsed={false}
          pathname={pathname}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
        />
      </aside>
    </>
  );
}
