using Microsoft.AspNetCore.SignalR;

namespace HelloWork.Api.Hubs;

/// <summary>
/// Real-time chat hub — clients join/leave group rooms and receive
/// broadcast messages via <c>ReceiveMessage</c>.
/// </summary>
public class ChatHub : Hub
{
    /// <summary>Subscribes the current connection to the SignalR group room.</summary>
    public async Task JoinGroup(string groupId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, groupId);

    /// <summary>Removes the current connection from the SignalR group room.</summary>
    public async Task LeaveGroup(string groupId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
}
