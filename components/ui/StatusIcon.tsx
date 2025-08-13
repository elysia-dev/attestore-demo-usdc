import { IntentStatus } from '@/types/transfer-history'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

const StatusIcon: React.FC<{ status: IntentStatus }> = ({ status }) => {
  switch (status) {
    case IntentStatus.SIGNALED:
      return <Clock className="w-4 h-4 text-yellow-500" />
    case IntentStatus.FULFILLED:
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case IntentStatus.RELEASED:
      return <CheckCircle className="w-4 h-4 text-blue-500" />
    case IntentStatus.CANCELLED:
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

export default StatusIcon
