// User message bubble

interface UserMessageProps {
  content: string
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-md rounded-lg bg-ppf-blue px-4 py-3 text-white">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
