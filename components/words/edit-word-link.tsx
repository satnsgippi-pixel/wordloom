"use client"

import Link from "next/link"

const EDIT_BUTTON_CLASS =
  "block w-full text-center py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"

interface EditWordLinkProps {
  wordId: string
  className?: string
  children?: React.ReactNode
}

/**
 * 単語編集ページへのリンクボタン。
 * 単語詳細・リザルトなどで共通利用する。
 */
export function EditWordLink({
  wordId,
  className = "",
  children = "Edit",
}: EditWordLinkProps) {
  return (
    <Link
      href={`/words/${wordId}/edit`}
      className={className ? `${EDIT_BUTTON_CLASS} ${className}` : EDIT_BUTTON_CLASS}
      aria-label="Edit word"
    >
      {children}
    </Link>
  )
}
